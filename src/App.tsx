import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import {
  MenuItem,
  CartItem,
  GeofenceState,
  BookingType,
  UserProfile,
  Order,
  SpiceLevel,
  TableBookingDetails,
  MenuSectionType,
  PresetLocation
} from './types/restaurant';
import {
  SHANKAR_RESTAURANT_LOCATION,
  calculateHaversineDistanceKm,
  getLiveDeviceLocation,
  PRESET_LOCATIONS
} from './services/locationService';
import { cloudflareTurnstile } from './services/cloudflareTurnstile';
import { auth, signOutUser } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  fetchUserOrders,
  saveOrderToFirestore,
  INITIAL_REAL_ORDERS
} from './services/orderService';
import { isAdminUser, ADMIN_EMAILS, isAuthorizedAdminEmail } from './utils/authHelper';

// Consolidated Core Components (Critical Rendering Path)
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { MenuSection } from './components/MenuSection';
import { HeritageStorySection } from './components/HeritageStorySection';
import { Footer } from './components/Footer';
import { FloatingActionButtons } from './components/FloatingActionButtons';
import { ShoppingBag, CheckCircle2, ArrowRight } from 'lucide-react';
import type { HelpTabType } from './components/HelpModal';
import { updatePageSEO } from './utils/seoHelper';

// Dynamically lazy-loaded Modal Dialogs for ultra-fast initial page loads & zero bundle bloat
const CartDrawer = lazy(() => import('./components/CartDrawer').then((m) => ({ default: m.CartDrawer })));
const CheckoutModal = lazy(() => import('./components/CheckoutModal').then((m) => ({ default: m.CheckoutModal })));
const ItemCustomizationModal = lazy(() => import('./components/ItemCustomizationModal').then((m) => ({ default: m.ItemCustomizationModal })));
const TableBookingModal = lazy(() => import('./components/TableBookingModal').then((m) => ({ default: m.TableBookingModal })));
const AuthModal = lazy(() => import('./components/AuthModal').then((m) => ({ default: m.AuthModal })));
const OrderSuccessModal = lazy(() => import('./components/OrderSuccessModal').then((m) => ({ default: m.OrderSuccessModal })));
const OrdersModal = lazy(() => import('./components/OrdersModal').then((m) => ({ default: m.OrdersModal })));
const CallToOrderModal = lazy(() => import('./components/CallToOrderModal').then((m) => ({ default: m.CallToOrderModal })));
const ExploreModal = lazy(() => import('./components/ExploreModal').then((m) => ({ default: m.ExploreModal })));
const CateringModal = lazy(() => import('./components/CateringModal').then((m) => ({ default: m.CateringModal })));
const VisitUsModal = lazy(() => import('./components/VisitUsModal').then((m) => ({ default: m.VisitUsModal })));
const HelpModal = lazy(() => import('./components/HelpModal').then((m) => ({ default: m.HelpModal })));
const AdminPanelModal = lazy(() => import('./components/AdminPanelModal').then((m) => ({ default: m.AdminPanelModal })));
const TableQrScannerModal = lazy(() => import('./components/TableQrScannerModal').then((m) => ({ default: m.TableQrScannerModal })));

export default function App() {
  // App state
  const [bookingType, setBookingType] = useState<BookingType>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('table') || params.get('t') || sessionStorage.getItem('maheswari_hotel_table')) {
        return 'dine_in';
      }
    }
    return 'delivery';
  });

  // Table QR Code Ordering System (Auto-detects URL ?table=... or QR stand scan)
  const [activeTable, setActiveTable] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tableParam = params.get('table') || params.get('t');
      if (tableParam) return decodeURIComponent(tableParam);
      if (window.location.hash.includes('table=')) {
        const match = window.location.hash.match(/table=([^&]+)/);
        if (match) return decodeURIComponent(match[1]);
      }
      return sessionStorage.getItem('maheswari_hotel_table');
    }
    return null;
  });
  const [isTableQrModalOpen, setIsTableQrModalOpen] = useState(false);
  const [activeMenuSection, setActiveMenuSection] = useState<MenuSectionType>('all_day');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [deliveryRadiusKm, setDeliveryRadiusKm] = useState<number>(
    SHANKAR_RESTAURANT_LOCATION.maxDeliveryRadiusKm
  );
  const [dineInRadiusMeters] = useState<number>(
    SHANKAR_RESTAURANT_LOCATION.maxDineInRadiusMeters
  );

  // Cart state & animations
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('shankar_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartBouncing, setIsCartBouncing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [discountCode, setDiscountCode] = useState<string>('');
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);

  // Real Orders state (empty by default until user signs in and orders)
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('shankar_orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // User Profile (Default to guest patron until signed in)
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('shankar_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Only restore legitimate authenticated session; do not default to old hardcoded static admin
        if (parsed && parsed.isLoggedIn && parsed.email && parsed.id !== 'tej_admin') {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return {
      id: 'guest',
      name: '',
      phone: '',
      email: '',
      authProvider: 'guest',
      isLoggedIn: false,
      role: 'customer',
      savedAddresses: [],
      loyaltyPoints: 0,
      recentOrdersCount: 0
    };
  });

  // Geofence state (Default initialized to Connaught Place nearby preset so app is ready)
  const [geofenceState, setGeofenceState] = useState<GeofenceState>(() => {
    const defaultPreset = PRESET_LOCATIONS[1]; // Connaught Place Barakhamba Road (0.6 km away)
    const distance = calculateHaversineDistanceKm(
      SHANKAR_RESTAURANT_LOCATION.center.lat,
      SHANKAR_RESTAURANT_LOCATION.center.lng,
      defaultPreset.lat,
      defaultPreset.lng
    );

    return {
      userCoords: {
        lat: defaultPreset.lat,
        lng: defaultPreset.lng,
        addressLabel: defaultPreset.name,
        accuracyMeters: 10
      },
      distanceKm: distance,
      distanceMeters: Math.round(distance * 1000),
      isInsideDeliveryRadius: distance <= SHANKAR_RESTAURANT_LOCATION.maxDeliveryRadiusKm,
      isInsideDineInRadius: distance * 1000 <= SHANKAR_RESTAURANT_LOCATION.maxDineInRadiusMeters,
      status: 'simulated',
      errorMessage: null,
      lastCheckedAt: new Date().toLocaleTimeString()
    };
  });

  // Modals state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isReservationsOpen, setIsReservationsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  // Denver Spice Room Navigation feature modals
  const [isCallToOrderOpen, setIsCallToOrderOpen] = useState(false);
  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const [exploreInitialTab, setExploreInitialTab] = useState<'gallery' | 'buffet_vs_thali'>('gallery');
  const [isCateringOpen, setIsCateringOpen] = useState(false);
  const [isVisitUsOpen, setIsVisitUsOpen] = useState(false);
  const [visitUsInitialTab, setVisitUsInitialTab] = useState<'location' | 'about_us'>('location');
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [helpInitialTab, setHelpInitialTab] = useState<HelpTabType>('faqs');
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Background idle prefetching: warms up modal bundles during browser idle periods without impacting initial load
  useEffect(() => {
    const prefetchModals = () => {
      import('./components/CartDrawer');
      import('./components/ItemCustomizationModal');
      import('./components/TableBookingModal');
    };
    if (typeof window !== 'undefined') {
      if ('requestIdleCallback' in window) {
        (window as Window & { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(prefetchModals);
      } else {
        setTimeout(prefetchModals, 2000);
      }
    }
  }, []);

  // Sync cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('shankar_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [cartItems]);

  // Sync user to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('shankar_user', JSON.stringify(user));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [user]);

  // Sync orders to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('shankar_orders', JSON.stringify(orders));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [orders]);

  // Firebase Auth State Listener (Google Sign-In integration)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser: any) => {
      if (fbUser) {
        const userEmail = (fbUser.email || '').toLowerCase().trim();
        const isAdmin = isAuthorizedAdminEmail(userEmail);
        const googleProfile: UserProfile = {
          id: fbUser.uid,
          name: fbUser.displayName || (isAdmin ? 'Tej Singh Saud' : 'Maheswari Guest'),
          email: fbUser.email || '',
          phone: fbUser.phoneNumber || '98110 23456',
          photoURL: fbUser.photoURL || undefined,
          authProvider: 'google',
          isLoggedIn: true,
          role: isAdmin ? 'admin' : 'customer',
          savedAddresses: [
            'Flat 402, Block B, Barakhamba Road, Connaught Place, New Delhi',
            'C-12, Green Park Main, South Delhi'
          ],
          loyaltyPoints: isAdmin ? 5000 : 500,
          recentOrdersCount: orders.length
        };
        setUser(googleProfile);

        // Fetch user's real orders from Firestore
        const userOrders = await fetchUserOrders(fbUser.uid);
        if (userOrders && userOrders.length > 0) {
          setOrders(userOrders);
        }
      }
    });

    return () => unsubscribe();
  }, [orders.length]);

  // Load real orders on initial load
  useEffect(() => {
    const loadOrders = async () => {
      const fetched = await fetchUserOrders(user.id);
      if (fetched && fetched.length > 0) {
        setOrders(fetched);
      }
    };
    loadOrders();
  }, [user.id]);

  // Start Cloudflare Turnstile background verification silently
  useEffect(() => {
    cloudflareTurnstile.runBackgroundChallenge(false);
  }, []);

  // Update geofence verification helper
  const updateGeofenceCoordinates = useCallback(
    (lat: number, lng: number, addressLabel: string, accuracy = 15, isGPS = false) => {
      const distance = calculateHaversineDistanceKm(
        SHANKAR_RESTAURANT_LOCATION.center.lat,
        SHANKAR_RESTAURANT_LOCATION.center.lng,
        lat,
        lng
      );

      const isInsideDelivery = distance <= deliveryRadiusKm;
      const isInsideDineIn = distance * 1000 <= dineInRadiusMeters;

      setGeofenceState({
        userCoords: {
          lat,
          lng,
          addressLabel,
          accuracyMeters: accuracy
        },
        distanceKm: distance,
        distanceMeters: Math.round(distance * 1000),
        isInsideDeliveryRadius: isInsideDelivery,
        isInsideDineInRadius: isInsideDineIn,
        status: isGPS ? 'granted' : 'simulated',
        errorMessage: null,
        lastCheckedAt: new Date().toLocaleTimeString()
      });
    },
    [deliveryRadiusKm, dineInRadiusMeters]
  );

  // Trigger real browser GPS
  const handleRequestLiveGPS = async () => {
    setGeofenceState((prev: GeofenceState) => ({ ...prev, status: 'requesting', errorMessage: null }));
    try {
      const coords = await getLiveDeviceLocation();
      updateGeofenceCoordinates(
        coords.lat,
        coords.lng,
        coords.addressLabel,
        coords.accuracyMeters,
        true
      );
    } catch (err: any) {
      setGeofenceState((prev: GeofenceState) => ({
        ...prev,
        status: 'denied',
        errorMessage: err?.message || 'Could not acquire GPS position.'
      }));
    }
  };

  // Switch preset location
  const handleSelectPreset = (presetId: string) => {
    const preset = PRESET_LOCATIONS.find((p: PresetLocation) => p.id === presetId);
    if (!preset) return;
    updateGeofenceCoordinates(preset.lat, preset.lng, preset.name, 10, false);
  };

  // Recalculate geofence when radius changes
  const handleUpdateRadiusKm = (newRadius: number) => {
    setDeliveryRadiusKm(newRadius);
    if (geofenceState.userCoords) {
      const distance = calculateHaversineDistanceKm(
        SHANKAR_RESTAURANT_LOCATION.center.lat,
        SHANKAR_RESTAURANT_LOCATION.center.lng,
        geofenceState.userCoords.lat,
        geofenceState.userCoords.lng
      );
      setGeofenceState((prev: GeofenceState) => ({
        ...prev,
        isInsideDeliveryRadius: distance <= newRadius
      }));
    }
  };

  // Listen to Hotel Table URL Query Parameter (?table=Table 4 or ?t=4)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tableParam = params.get('table') || params.get('t');
      if (tableParam) {
        const decoded = decodeURIComponent(tableParam);
        setActiveTable(decoded);
        setBookingType('dine_in');
        sessionStorage.setItem('maheswari_hotel_table', decoded);
        setToastMessage(`🍽️ Connected to ${decoded}! Placing orders will alert the chef.`);
        setTimeout(() => setToastMessage(null), 4000);
      }
    }
  }, []);

  const handleSelectTable = (tableName: string) => {
    setActiveTable(tableName);
    setBookingType('dine_in');
    sessionStorage.setItem('maheswari_hotel_table', tableName);

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('table', tableName);
      window.history.pushState(null, '', url.toString());
    }

    setToastMessage(`🍽️ Scanned ${tableName}! Your order will be served directly to this table.`);
    setTimeout(() => setToastMessage(null), 3500);

    scrollToSection('menu');
  };

  const handleClearTable = () => {
    setActiveTable(null);
    setBookingType('delivery');
    sessionStorage.removeItem('maheswari_hotel_table');
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('table');
      url.searchParams.delete('t');
      window.history.pushState(null, '', url.pathname);
    }
    setToastMessage('Switched to Online Delivery mode.');
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleChangeBookingType = (newType: BookingType) => {
    if (newType === 'dine_in') {
      if (!activeTable) {
        setIsTableQrModalOpen(true);
        setToastMessage('📷 Scanning Table QR Required: Dine-in orders can only come from your scanned hotel dining table.');
        setTimeout(() => setToastMessage(null), 3500);
        return;
      }
    }
    setBookingType(newType);
  };

  // Cart operations with delightful visual animation feedback
  const handleAddToCart = (
    item: MenuItem,
    portion: 'full' | 'half' = 'full',
    spiceLevel: SpiceLevel = 1,
    quantity: number = 1,
    specialInstructions?: string
  ) => {
    const unitPrice = portion === 'half' && item.halfPrice ? item.halfPrice : item.price;
    const cartItemId = `${item.id}_${portion}_spice${spiceLevel}_${specialInstructions || ''}`;

    setCartItems((prev) => {
      const existing = prev.find((i) => i.cartItemId === cartItemId);
      if (existing) {
        return prev.map((i) =>
          i.cartItemId === cartItemId
            ? {
                ...i,
                quantity: i.quantity + quantity,
                itemTotal: (i.quantity + quantity) * unitPrice
              }
            : i
        );
      }
      return [
        ...prev,
        {
          cartItemId,
          menuItem: item,
          quantity,
          portion,
          spiceLevel,
          specialInstructions,
          unitPrice,
          itemTotal: unitPrice * quantity
        }
      ];
    });

    // 1. Trigger shopping bag icon animation bounce
    setIsCartBouncing(true);
    setTimeout(() => setIsCartBouncing(false), 650);

    // 2. Trigger floating notification pill
    setToastMessage(`Added ${quantity > 1 ? `${quantity}x ` : ''}${item.name} to Bag`);
    setTimeout(() => setToastMessage(null), 2400);

    // Trigger Cloudflare silent background entropy check on cart interaction
    cloudflareTurnstile.runBackgroundChallenge(false);
  };

  const handleUpdateQuantity = (cartItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(cartItemId);
      return;
    }
    setCartItems((prev) =>
      prev.map((i) => {
        if (i.cartItemId === cartItemId) {
          const unitPrice =
            i.portion === 'half' && i.menuItem.halfPrice ? i.menuItem.halfPrice : i.menuItem.price;
          return {
            ...i,
            quantity: newQuantity,
            itemTotal: newQuantity * unitPrice
          };
        }
        return i;
      })
    );
  };

  const handleRemoveItem = (cartItemId: string) => {
    setCartItems((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
  };

  // Reorder dishes from order history
  const handleReorder = (items: CartItem[]) => {
    setCartItems((prev) => {
      const combined = [...prev];
      items.forEach((item) => {
        const existing = combined.find((c) => c.cartItemId === item.cartItemId);
        if (existing) {
          existing.quantity += item.quantity;
          existing.itemTotal = existing.quantity * (item.itemTotal / item.quantity);
        } else {
          combined.push({ ...item });
        }
      });
      return combined;
    });

    setIsCartBouncing(true);
    setTimeout(() => setIsCartBouncing(false), 600);
    setIsCartOpen(true);
  };

  // Promo discount apply
  const handleApplyDiscount = (code: string): boolean => {
    const clean = code.trim().toUpperCase();
    const subtotal = cartItems.reduce((acc, item) => acc + item.itemTotal, 0);

    if (clean === 'SHANKAR20') {
      const discount = Math.round(subtotal * 0.2);
      setDiscountCode('SHANKAR20 (20% Off)');
      setAppliedDiscount(discount);
      return true;
    }
    if (clean === 'TASTE50') {
      setDiscountCode('TASTE50 (₹50 Off)');
      setAppliedDiscount(Math.min(50, subtotal));
      return true;
    }
    return false;
  };

  // Table reservation complete
  const handleConfirmReservation = (details: TableBookingDetails) => {
    setIsReservationsOpen(false);

    const orderId = `TBL-${Math.floor(1000 + Math.random() * 9000)}`;
    const tableOrder: Order = {
      id: orderId,
      orderNumber: orderId,
      createdAt: `${details.date} at ${details.timeSlot}`,
      bookingType: 'dine_in',
      items: [],
      subtotal: 0,
      gstAmount: 0,
      deliveryFee: 0,
      discountAmount: 0,
      grandTotal: 0,
      customer: {
        name: details.guestName,
        phone: details.guestPhone
      },
      tableDetails: details,
      paymentMethod: 'pay_at_counter',
      paymentStatus: 'pending',
      orderStatus: 'confirmed',
      geofenceVerification: {
        verified: true,
        distanceKm: geofenceState.distanceKm ?? 0.05,
        userLocationLabel: `${details.seatingArea} Table for ${details.guestsCount} Guests`
      },
      turnstileToken: '0.cf_tnst_tbl_reservation_verified',
      estimatedTimeMinutes: 0
    };

    setActiveOrder(tableOrder);
  };

  // Order success handler with celebratory confetti & real Firestore persistence
  const handleOrderSuccess = async (order: Order) => {
    setIsCheckoutOpen(false);
    setIsCartOpen(false);
    setCartItems([]);
    setDiscountCode('');
    setAppliedDiscount(0);
    setActiveOrder(order);

    // 1. Add to local orders list immediately
    setOrders((prev) => [order, ...prev]);

    // 2. Persist order into backend /api/orders & Firestore
    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
      });
    } catch (e) {
      console.warn('Backend API order sync error:', e);
    }

    try {
      await saveOrderToFirestore(order, user.id);
    } catch (e) {
      console.warn('Saved order locally:', e);
    }

    // 3. Fire celebratory confetti animation via dynamic import (non-blocking)
    try {
      const confettiModule = await import('canvas-confetti');
      const confetti = confettiModule.default;
      confetti({
        particleCount: 85,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // ignore
    }
  };

  // Live order status simulator for testing & guest tracking
  const handleAdvanceOrderStatus = (orderId: string) => {
    setOrders((prev) => {
      const updated = prev.map((order) => {
        if (order.id !== orderId) return order;
        let nextStatus: Order['orderStatus'] = order.orderStatus;
        if (order.orderStatus === 'placed') nextStatus = 'confirmed';
        else if (order.orderStatus === 'confirmed') nextStatus = 'cooking';
        else if (order.orderStatus === 'cooking') nextStatus = order.bookingType === 'dine_in' ? 'ready_at_table' : 'out_for_delivery';
        else if (order.orderStatus === 'ready_at_table' || order.orderStatus === 'out_for_delivery') nextStatus = 'completed';
        
        // Notify backend of status change
        fetch(`/api/orders/${order.id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: nextStatus })
        }).catch(() => {});

        return { ...order, orderStatus: nextStatus };
      });
      try {
        localStorage.setItem('shankar_orders', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // SPA Deep-linking & Per-Page SEO Routing
  const navigateToRoute = (route: string, openCallback?: () => void) => {
    updatePageSEO(route);
    if (typeof window !== 'undefined') {
      const url = route === 'home' ? window.location.pathname : `#${route}`;
      window.history.pushState(null, '', url);
    }
    if (openCallback) openCallback();
  };

  const closeToHome = (closeCallback: () => void) => {
    closeCallback();
    updatePageSEO('home');
    if (typeof window !== 'undefined' && window.location.hash) {
      window.history.pushState(null, '', window.location.pathname);
    }
  };

  // Sync route on initial load and handle browser back/forward buttons
  useEffect(() => {
    const handleHashSync = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (!hash) {
        updatePageSEO('home');
        return;
      }
      if (hash === 'reservations') {
        setIsReservationsOpen(true);
        updatePageSEO('reservations');
      } else if (hash === 'catering') {
        setIsCateringOpen(true);
        updatePageSEO('catering');
      } else if (hash === 'gallery') {
        setExploreInitialTab('gallery');
        setIsExploreOpen(true);
        updatePageSEO('gallery');
      } else if (hash === 'buffet') {
        setExploreInitialTab('buffet_vs_thali');
        setIsExploreOpen(true);
        updatePageSEO('buffet');
      } else if (hash === 'faqs') {
        setHelpInitialTab('faqs');
        setIsHelpOpen(true);
        updatePageSEO('faqs');
      } else if (hash === 'allergens') {
        setHelpInitialTab('allergen_guide');
        setIsHelpOpen(true);
        updatePageSEO('allergens');
      } else if (hash === 'careers') {
        setHelpInitialTab('careers');
        setIsHelpOpen(true);
        updatePageSEO('careers');
      } else if (hash === 'contact') {
        setHelpInitialTab('contact');
        setIsHelpOpen(true);
        updatePageSEO('contact');
      } else if (hash === 'location') {
        setVisitUsInitialTab('location');
        setIsVisitUsOpen(true);
        updatePageSEO('location');
      } else if (hash === 'about') {
        setVisitUsInitialTab('about_us');
        setIsVisitUsOpen(true);
        updatePageSEO('about');
      } else if (hash === 'cart') {
        setIsCartOpen(true);
        updatePageSEO('cart');
      } else if (hash === 'orders') {
        setIsOrdersOpen(true);
        updatePageSEO('orders');
      } else if (hash === 'call') {
        setIsCallToOrderOpen(true);
        updatePageSEO('call');
      } else if (hash === 'menu') {
        scrollToSection('menu');
        updatePageSEO('menu');
      } else if (hash === 'heritage') {
        scrollToSection('heritage');
        updatePageSEO('heritage');
      } else if (hash === 'admin') {
        if (user.isLoggedIn && isAdminUser(user)) {
          setIsAdminOpen(true);
          updatePageSEO('admin');
        } else {
          setIsAuthOpen(true);
        }
      }
    };

    handleHashSync();

    window.addEventListener('hashchange', handleHashSync);
    window.addEventListener('popstate', handleHashSync);
    return () => {
      window.removeEventListener('hashchange', handleHashSync);
      window.removeEventListener('popstate', handleHashSync);
    };
  }, [user]);

  // Admin Portal launcher: Opens directly if authorized admin, otherwise prompts sign-in
  const handleOpenAdmin = () => {
    if (user.isLoggedIn && isAdminUser(user)) {
      setIsAdminOpen(true);
      navigateToRoute('admin');
    } else {
      setIsAuthOpen(true);
    }
  };

  const cartCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);
  const cartSubtotal = cartItems.reduce((acc, i) => acc + i.itemTotal, 0);

  return (
    <div className="min-h-screen bg-[#faf8f5] text-stone-900 flex flex-col font-sans-body relative">
      {/* Top Navigation */}
      <Navbar
        cartCount={cartCount}
        cartTotal={cartSubtotal}
        isCartBouncing={isCartBouncing}
        ordersCount={orders.length}
        onOpenCart={() => navigateToRoute('cart', () => setIsCartOpen(true))}
        onOpenOrders={() => navigateToRoute('orders', () => setIsOrdersOpen(true))}
        onOpenReservations={() => navigateToRoute('reservations', () => setIsReservationsOpen(true))}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenAdmin={handleOpenAdmin}
        onOpenCallToOrder={() => navigateToRoute('call', () => setIsCallToOrderOpen(true))}
        onOpenExplore={(tab) => {
          navigateToRoute(tab === 'gallery' ? 'gallery' : 'buffet', () => {
            setExploreInitialTab(tab);
            setIsExploreOpen(true);
          });
        }}
        onOpenCatering={() => navigateToRoute('catering', () => setIsCateringOpen(true))}
        onOpenVisitUs={(tab) => {
          navigateToRoute(tab === 'location' ? 'location' : 'about', () => {
            setVisitUsInitialTab(tab);
            setIsVisitUsOpen(true);
          });
        }}
        onOpenHelp={(tab) => {
          const routeMap: Record<string, string> = {
            faqs: 'faqs',
            allergen_guide: 'allergens',
            careers: 'careers',
            contact: 'contact'
          };
          navigateToRoute(routeMap[tab] || 'faqs', () => {
            setHelpInitialTab(tab);
            setIsHelpOpen(true);
          });
        }}
        onSelectMenuSection={(sec) => {
          setActiveMenuSection(sec);
          setSelectedCategory('all');
          navigateToRoute('menu');
        }}
        onSelectMenuCategory={(cat) => setSelectedCategory(cat)}
        user={user}
        geofenceState={geofenceState}
        activeTable={activeTable}
        onOpenQrScanner={() => setIsTableQrModalOpen(true)}
      />

      <main className="flex-1 pb-12 sm:pb-16">
        {/* Imperial Culinary Hero Showcase */}
        <HeroSection
          bookingType={bookingType}
          onChangeBookingType={handleChangeBookingType}
          activeTable={activeTable}
          onOpenQrScanner={() => setIsTableQrModalOpen(true)}
          onOpenReservations={() => navigateToRoute('reservations', () => setIsReservationsOpen(true))}
          onScrollToMenu={() => {
            scrollToSection('menu');
            navigateToRoute('menu');
          }}
        />

        {/* Menu Section - Dishes, Categories & Dining Mode */}
        <MenuSection
          bookingType={bookingType}
          onChangeBookingType={handleChangeBookingType}
          activeTable={activeTable}
          onOpenQrScanner={() => setIsTableQrModalOpen(true)}
          onClearActiveTable={handleClearTable}
          activeMenuSection={activeMenuSection}
          onChangeMenuSection={(sec) => {
            setActiveMenuSection(sec);
            setSelectedCategory('all');
            navigateToRoute('menu');
          }}
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => setSelectedCategory(cat)}
          onAddToCart={(item, portion, spice) => handleAddToCart(item, portion, spice, 1)}
          onOpenItemModal={(item) => setCustomizingItem(item)}
          cartItems={cartItems}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
        />

        {/* Heritage Story & Anti-Abuse Credo */}
        <HeritageStorySection
          onOpenReservations={() => navigateToRoute('reservations', () => setIsReservationsOpen(true))}
        />
      </main>

      {/* Footer */}
      <Footer
        onSelectMenuSection={(sec) => {
          setActiveMenuSection(sec);
          setSelectedCategory('all');
          navigateToRoute('menu');
        }}
        onOpenExplore={(tab) => {
          navigateToRoute(tab === 'gallery' ? 'gallery' : 'buffet', () => {
            setExploreInitialTab(tab);
            setIsExploreOpen(true);
          });
        }}
        onOpenCatering={() => navigateToRoute('catering', () => setIsCateringOpen(true))}
        onOpenVisitUs={(tab) => {
          navigateToRoute(tab === 'location' ? 'location' : 'about', () => {
            setVisitUsInitialTab(tab);
            setIsVisitUsOpen(true);
          });
        }}
        onOpenHelp={(tab) => {
          const routeMap: Record<string, string> = {
            faqs: 'faqs',
            allergen_guide: 'allergens',
            careers: 'careers',
            contact: 'contact'
          };
          navigateToRoute(routeMap[tab] || 'faqs', () => {
            setHelpInitialTab(tab);
            setIsHelpOpen(true);
          });
        }}
        onOpenReservations={() => navigateToRoute('reservations', () => setIsReservationsOpen(true))}
        onOpenCallToOrder={() => navigateToRoute('call', () => setIsCallToOrderOpen(true))}
        onOpenAdmin={handleOpenAdmin}
        user={user}
      />

      {/* Popping ups of two: Order Now & Call to Order */}
      <FloatingActionButtons
        cartCount={cartCount}
        cartTotal={cartSubtotal}
        isCartBouncing={isCartBouncing}
        onOpenCallToOrder={() => navigateToRoute('call', () => setIsCallToOrderOpen(true))}
        onOpenOrderNow={() => {
          if (cartCount > 0) {
            navigateToRoute('cart', () => setIsCartOpen(true));
          } else {
            scrollToSection('menu');
            navigateToRoute('menu');
          }
        }}
      />

      {/* Floating Animated Toast Pill when item is added, safely offset on mobile */}
      {toastMessage && (
        <div className="fixed bottom-[calc(118px+env(safe-area-inset-bottom,0px))] sm:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-stone-950/95 text-white px-4 py-2.5 rounded-full shadow-2xl border border-amber-500/30 flex items-center gap-3 text-xs font-medium animate-float-fade backdrop-blur-md max-w-[92vw]">
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <span className="text-stone-100 truncate">{toastMessage}</span>
          <button
            onClick={() => {
              setToastMessage(null);
              setIsCartOpen(true);
            }}
            className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 pl-2 border-l border-stone-800 cursor-pointer shrink-0"
          >
            <span>View Bag</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Dynamically Lazy Loaded Modal Dialogs */}
      <Suspense fallback={null}>
        {isCallToOrderOpen && (
          <CallToOrderModal
            isOpen={isCallToOrderOpen}
            onClose={() => closeToHome(() => setIsCallToOrderOpen(false))}
            onOpenReservations={() => navigateToRoute('reservations', () => setIsReservationsOpen(true))}
            onOpenOnlineOrder={() => {
              scrollToSection('menu');
              navigateToRoute('menu');
              setIsCartOpen(true);
            }}
          />
        )}

        {isExploreOpen && (
          <ExploreModal
            isOpen={isExploreOpen}
            onClose={() => closeToHome(() => setIsExploreOpen(false))}
            initialTab={exploreInitialTab}
            onOpenReservations={() => navigateToRoute('reservations', () => setIsReservationsOpen(true))}
            onOpenMenu={() => {
              scrollToSection('menu');
              navigateToRoute('menu');
            }}
          />
        )}

        {isCateringOpen && (
          <CateringModal
            isOpen={isCateringOpen}
            onClose={() => closeToHome(() => setIsCateringOpen(false))}
            onOpenCallToOrder={() => navigateToRoute('call', () => setIsCallToOrderOpen(true))}
          />
        )}

        {isVisitUsOpen && (
          <VisitUsModal
            isOpen={isVisitUsOpen}
            onClose={() => closeToHome(() => setIsVisitUsOpen(false))}
            initialTab={visitUsInitialTab}
            geofenceState={geofenceState}
            onOpenReservations={() => navigateToRoute('reservations', () => setIsReservationsOpen(true))}
          />
        )}

        {isHelpOpen && (
          <HelpModal
            isOpen={isHelpOpen}
            onClose={() => closeToHome(() => setIsHelpOpen(false))}
            initialTab={helpInitialTab}
            onOpenCallToOrder={() => navigateToRoute('call', () => setIsCallToOrderOpen(true))}
          />
        )}

        {isCartOpen && (
          <CartDrawer
            isOpen={isCartOpen}
            onClose={() => closeToHome(() => setIsCartOpen(false))}
            cartItems={cartItems}
            bookingType={bookingType}
            onChangeBookingType={handleChangeBookingType}
            geofenceState={geofenceState}
            deliveryRadiusKm={deliveryRadiusKm}
            discountCode={discountCode}
            appliedDiscount={appliedDiscount}
            onApplyDiscount={handleApplyDiscount}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            activeTable={activeTable}
            onOpenQrScanner={() => setIsTableQrModalOpen(true)}
            onProceedToCheckout={() => {
              setIsCartOpen(false);
              setIsCheckoutOpen(true);
            }}
            onOpenReservations={() => {
              setIsCartOpen(false);
              navigateToRoute('reservations', () => setIsReservationsOpen(true));
            }}
          />
        )}

        {isCheckoutOpen && (
          <CheckoutModal
            isOpen={isCheckoutOpen}
            onClose={() => closeToHome(() => setIsCheckoutOpen(false))}
            cartItems={cartItems}
            bookingType={bookingType}
            geofenceState={geofenceState}
            deliveryRadiusKm={deliveryRadiusKm}
            discountCode={discountCode}
            appliedDiscount={appliedDiscount}
            user={user}
            activeTable={activeTable}
            onOpenQrScanner={() => setIsTableQrModalOpen(true)}
            onOrderSuccess={handleOrderSuccess}
          />
        )}

        {customizingItem && (
          <ItemCustomizationModal
            item={customizingItem}
            isOpen={!!customizingItem}
            onClose={() => setCustomizingItem(null)}
            onAddToCart={handleAddToCart}
          />
        )}

        {isReservationsOpen && (
          <TableBookingModal
            isOpen={isReservationsOpen}
            onClose={() => closeToHome(() => setIsReservationsOpen(false))}
            geofenceState={geofenceState}
            onConfirmBooking={handleConfirmReservation}
          />
        )}

        {isAuthOpen && (
          <AuthModal
            isOpen={isAuthOpen}
            onClose={() => closeToHome(() => setIsAuthOpen(false))}
            user={user}
            onLogin={(updated) => {
              setUser(updated);
              if (isAdminUser(updated)) {
                setIsAdminOpen(true);
                navigateToRoute('admin');
                setToastMessage('👑 Administrator authenticated! Welcome to Operations Console.');
                setTimeout(() => setToastMessage(null), 3500);
              } else {
                setToastMessage(`👋 Welcome, ${updated.name || 'valued guest'}!`);
                setTimeout(() => setToastMessage(null), 3000);
              }
            }}
            onLogout={async () => {
              try {
                await signOutUser();
              } catch {}
              try {
                localStorage.removeItem('shankar_user');
              } catch {}
              setUser({
                id: 'guest',
                name: '',
                phone: '',
                email: '',
                authProvider: 'guest',
                isLoggedIn: false,
                role: 'customer',
                savedAddresses: [],
                loyaltyPoints: 0,
                recentOrdersCount: 0
              });
              setIsAdminOpen(false);
              closeToHome(() => setIsAuthOpen(false));
            }}
            onOpenOrders={() => navigateToRoute('orders', () => setIsOrdersOpen(true))}
            onOpenAdmin={() => {
              setIsAdminOpen(true);
              navigateToRoute('admin');
            }}
          />
        )}

        {isOrdersOpen && (
          <OrdersModal
            isOpen={isOrdersOpen}
            onClose={() => closeToHome(() => setIsOrdersOpen(false))}
            orders={orders}
            onReorder={handleReorder}
            onViewOrderReceipt={(order) => {
              setIsOrdersOpen(false);
              setActiveOrder(order);
            }}
            onAdvanceOrderStatus={handleAdvanceOrderStatus}
          />
        )}

        {activeOrder && (
          <OrderSuccessModal
            order={activeOrder}
            isOpen={!!activeOrder}
            onClose={() => closeToHome(() => setActiveOrder(null))}
          />
        )}

        {isAdminOpen && (
          <AdminPanelModal
            isOpen={isAdminOpen}
            onClose={() => closeToHome(() => setIsAdminOpen(false))}
            user={user}
            onUpdateUser={setUser}
          />
        )}

        {isTableQrModalOpen && (
          <TableQrScannerModal
            isOpen={isTableQrModalOpen}
            onClose={() => setIsTableQrModalOpen(false)}
            activeTable={activeTable}
            onSelectTable={handleSelectTable}
            onClearTable={handleClearTable}
          />
        )}
      </Suspense>
    </div>
  );
}
