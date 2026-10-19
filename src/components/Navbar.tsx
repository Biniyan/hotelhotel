import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  User,
  ChevronDown,
  ChevronRight,
  Phone,
  ClipboardList,
  Utensils,
  Sun,
  Wine,
  Coffee,
  Sparkles,
  Calendar,
  UtensilsCrossed,
  MapPin,
  HelpCircle,
  Briefcase,
  AlertCircle,
  Compass,
  ShoppingBag,
  X,
  ShieldCheck,
  QrCode
} from 'lucide-react';
import { UserProfile, MenuSectionType, GeofenceState } from '../types/restaurant';
import { PalaceLogo } from './PalaceLogo';
import { isAdminUser } from '../utils/authHelper';

interface Props {
  cartCount: number;
  cartTotal: number;
  isCartBouncing: boolean;
  ordersCount: number;
  onOpenCart: () => void;
  onOpenOrders: () => void;
  onOpenReservations: () => void;
  onOpenAuth: () => void;
  onOpenCallToOrder: () => void;
  onOpenExplore: (tab: 'gallery' | 'buffet_vs_thali') => void;
  onOpenCatering: () => void;
  onOpenVisitUs: (tab: 'location' | 'about_us') => void;
  onOpenHelp: (tab: 'faqs' | 'contact' | 'careers' | 'allergen_guide') => void;
  onSelectMenuSection: (section: MenuSectionType) => void;
  onSelectMenuCategory?: (category: string) => void;
  onOpenAdmin?: () => void;
  user: UserProfile;
  geofenceState?: GeofenceState;
  onOpenQrScanner?: () => void;
}

export const Navbar: React.FC<Props> = ({
  cartCount,
  cartTotal,
  isCartBouncing,
  ordersCount,
  onOpenCart,
  onOpenOrders,
  onOpenReservations,
  onOpenAuth,
  onOpenCallToOrder,
  onOpenExplore,
  onOpenCatering,
  onOpenVisitUs,
  onOpenHelp,
  onSelectMenuSection,
  onSelectMenuCategory,
  onOpenAdmin,
  user,
  geofenceState,
  onOpenQrScanner,
}) => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openMobileNav, setOpenMobileNav] = useState<string | null>(null);
  const navContainerRef = useRef<HTMLDivElement>(null);
  const dropdownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Prevent background scrolling when mobile menu drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setOpenMobileNav(null); // Sub-menus reset to closed initially when drawer closes
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Clean up dropdown timeout on unmount
  useEffect(() => {
    return () => {
      if (dropdownTimeoutRef.current) {
        clearTimeout(dropdownTimeoutRef.current);
      }
    };
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      if (
        navContainerRef.current &&
        !navContainerRef.current.contains(e.target as Node)
      ) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  // Keyboard accessibility: Escape closes menus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        setActiveDropdown(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Desktop hover handlers: show sub menus and hold open as long as hover is present
  const handleMouseEnterDropdown = (id: string) => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
      dropdownTimeoutRef.current = null;
    }
    setActiveDropdown(id);
  };

  const handleMouseLeaveDropdown = () => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 250); // 250ms hold-open delay to comfortably move cursor into dropdown
  };

  // Toggle dropdown on click
  const handleDropdownToggle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
      dropdownTimeoutRef.current = null;
    }
    setActiveDropdown((prev) => (prev === id ? null : id));
  };

  const handleMenuClick = (section: MenuSectionType) => {
    setActiveDropdown(null);
    setMobileMenuOpen(false);
    onSelectMenuSection(section);
    const menuEl = document.getElementById('menu');
    if (menuEl) {
      menuEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const hasSignedInAndOrdered = user.isLoggedIn && ordersCount > 0;
  const isAdmin = user.isLoggedIn && isAdminUser(user);

  return (
    <header className="sticky top-0 z-40 bg-stone-900/95 backdrop-blur-md border-b border-stone-800 text-stone-100 transition-all font-sans-body">
      <div
        className="max-w-7xl mx-auto flex items-center justify-between gap-1.5 sm:gap-4 px-2.5 sm:px-6 py-1.5 sm:py-2.5 relative"
        ref={navContainerRef}
      >
        {/* Brand Wordmark (Always on Left) */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center gap-2 sm:gap-2.5 group shrink min-w-0"
          aria-label="MAHESWARI MULTI CUISINE RESTAURANT Home"
        >
          <PalaceLogo size="responsive" />
          <div className="flex flex-col min-w-0">
            <span className="text-sm sm:text-base lg:text-lg font-serif-display font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-300 to-amber-400 group-hover:from-white group-hover:to-amber-200 transition-all leading-tight">
              MAHESWARI
            </span>
            <span className="text-[8px] sm:text-[9.5px] uppercase tracking-[0.18em] text-amber-400 font-semibold font-mono -mt-0.5 whitespace-nowrap">
              MULTI CUISINE
            </span>
          </div>
        </a>

        {/* Desktop / Laptop Navigation Links: Shown ONLY when NOT logged in as admin */}
        {!isAdmin && (
          <nav className="hidden md:flex items-center gap-1 lg:gap-1.5 text-[11px] lg:text-xs font-semibold tracking-wide uppercase text-stone-300">
          {/* 1. MENU (All Day, Lunch, Bar Menu) */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnterDropdown('menu')}
            onMouseLeave={handleMouseLeaveDropdown}
          >
            <button
              type="button"
              onClick={(e) => handleDropdownToggle('menu', e)}
              className={`flex items-center gap-1 px-2.5 lg:px-3 py-1.5 lg:py-2 rounded-lg transition-colors cursor-pointer select-none ${
                activeDropdown === 'menu'
                  ? 'text-amber-400 bg-stone-800 ring-1 ring-amber-400/40'
                  : 'hover:text-amber-400 hover:bg-stone-800/60'
              }`}
            >
              <span>Menu</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  activeDropdown === 'menu' ? 'rotate-180 text-amber-400' : ''
                }`}
              />
            </button>

            {/* Sub-menu Dropdown: holds open as cursor enters */}
            {activeDropdown === 'menu' && (
              <div
                onMouseEnter={() => handleMouseEnterDropdown('menu')}
                onMouseLeave={handleMouseLeaveDropdown}
                onClick={(e) => e.stopPropagation()}
                className="absolute top-full left-0 pt-2 w-60 z-50 animate-slide-up before:content-[''] before:absolute before:-top-2 before:left-0 before:right-0 before:h-3"
              >
                <div className="bg-stone-900 border border-stone-800 rounded-xl shadow-2xl p-2 space-y-1">
                  <button
                    type="button"
                    onClick={() => handleMenuClick('all_day')}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs text-stone-200 hover:bg-amber-400/10 hover:text-amber-300 transition-colors cursor-pointer"
                  >
                    <Coffee className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <span className="font-bold block text-white">All Day Menu</span>
                      <span className="text-[10px] text-stone-400 block normal-case font-normal">
                        Curries, biryani & tandoor
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMenuClick('lunch')}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs text-stone-200 hover:bg-amber-400/10 hover:text-amber-300 transition-colors cursor-pointer"
                  >
                    <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <span className="font-bold block text-white">Lunch Menu</span>
                      <span className="text-[10px] text-stone-400 block normal-case font-normal">
                        Royal Thalis & express bowls
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMenuClick('bar')}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs text-stone-200 hover:bg-amber-400/10 hover:text-amber-300 transition-colors cursor-pointer"
                  >
                    <Wine className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <span className="font-bold block text-white">Bar Menu</span>
                      <span className="text-[10px] text-stone-400 block normal-case font-normal">
                        Cocktails, beers & spirits
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 2. EXPLORE (Gallery, Buffet vs Thali) */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnterDropdown('explore')}
            onMouseLeave={handleMouseLeaveDropdown}
          >
            <button
              type="button"
              onClick={(e) => handleDropdownToggle('explore', e)}
              className={`flex items-center gap-1 px-2.5 lg:px-3 py-1.5 lg:py-2 rounded-lg transition-colors cursor-pointer select-none ${
                activeDropdown === 'explore'
                  ? 'text-amber-400 bg-stone-800 ring-1 ring-amber-400/40'
                  : 'hover:text-amber-400 hover:bg-stone-800/60'
              }`}
            >
              <span>Explore</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  activeDropdown === 'explore' ? 'rotate-180 text-amber-400' : ''
                }`}
              />
            </button>

            {activeDropdown === 'explore' && (
              <div
                onMouseEnter={() => handleMouseEnterDropdown('explore')}
                onMouseLeave={handleMouseLeaveDropdown}
                onClick={(e) => e.stopPropagation()}
                className="absolute top-full left-0 pt-2 w-56 z-50 animate-slide-up before:content-[''] before:absolute before:-top-2 before:left-0 before:right-0 before:h-3"
              >
                <div className="bg-stone-900 border border-stone-800 rounded-xl shadow-2xl p-2 space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveDropdown(null);
                      onOpenExplore('gallery');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs text-stone-200 hover:bg-amber-400/10 hover:text-amber-300 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <span className="font-bold block text-white">Gallery</span>
                      <span className="text-[10px] text-stone-400 block normal-case font-normal">
                        Palace & dining photos
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDropdown(null);
                      onOpenExplore('buffet_vs_thali');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs text-stone-200 hover:bg-amber-400/10 hover:text-amber-300 transition-colors cursor-pointer"
                  >
                    <Utensils className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <span className="font-bold block text-white">Buffet vs. Thali</span>
                      <span className="text-[10px] text-stone-400 block normal-case font-normal">
                        Comparison & dining guide
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 3. QUICK LINKS (Order Online, Reservations, Catering) */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnterDropdown('quick_links')}
            onMouseLeave={handleMouseLeaveDropdown}
          >
            <button
              type="button"
              onClick={(e) => handleDropdownToggle('quick_links', e)}
              className={`flex items-center gap-1 px-2.5 lg:px-3 py-1.5 lg:py-2 rounded-lg transition-colors cursor-pointer select-none ${
                activeDropdown === 'quick_links'
                  ? 'text-amber-400 bg-stone-800 ring-1 ring-amber-400/40'
                  : 'hover:text-amber-400 hover:bg-stone-800/60'
              }`}
            >
              <span>Quick Links</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  activeDropdown === 'quick_links' ? 'rotate-180 text-amber-400' : ''
                }`}
              />
            </button>

            {activeDropdown === 'quick_links' && (
              <div
                onMouseEnter={() => handleMouseEnterDropdown('quick_links')}
                onMouseLeave={handleMouseLeaveDropdown}
                onClick={(e) => e.stopPropagation()}
                className="absolute top-full left-0 pt-2 w-56 z-50 animate-slide-up before:content-[''] before:absolute before:-top-2 before:left-0 before:right-0 before:h-3"
              >
                <div className="bg-stone-900 border border-stone-800 rounded-xl shadow-2xl p-2 space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveDropdown(null);
                      onOpenCart();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs text-stone-200 hover:bg-amber-400/10 hover:text-amber-300 transition-colors cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <span className="font-bold block text-white">Order Online</span>
                      <span className="text-[10px] text-stone-400 block normal-case font-normal">
                        Takeout & direct delivery
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDropdown(null);
                      onOpenReservations();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs text-stone-200 hover:bg-amber-400/10 hover:text-amber-300 transition-colors cursor-pointer"
                  >
                    <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <span className="font-bold block text-white">Reservations</span>
                      <span className="text-[10px] text-stone-400 block normal-case font-normal">
                        Book dining hall tables
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDropdown(null);
                      onOpenCatering();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs text-stone-200 hover:bg-amber-400/10 hover:text-amber-300 transition-colors cursor-pointer"
                  >
                    <UtensilsCrossed className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <span className="font-bold block text-white">Catering</span>
                      <span className="text-[10px] text-stone-400 block normal-case font-normal">
                        Events & live tandoor
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 4. VISIT US (Location, About Us) */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnterDropdown('visit_us')}
            onMouseLeave={handleMouseLeaveDropdown}
          >
            <button
              type="button"
              onClick={(e) => handleDropdownToggle('visit_us', e)}
              className={`flex items-center gap-1 px-2.5 lg:px-3 py-1.5 lg:py-2 rounded-lg transition-colors cursor-pointer select-none ${
                activeDropdown === 'visit_us'
                  ? 'text-amber-400 bg-stone-800 ring-1 ring-amber-400/40'
                  : 'hover:text-amber-400 hover:bg-stone-800/60'
              }`}
            >
              <span>Visit Us</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  activeDropdown === 'visit_us' ? 'rotate-180 text-amber-400' : ''
                }`}
              />
            </button>

            {activeDropdown === 'visit_us' && (
              <div
                onMouseEnter={() => handleMouseEnterDropdown('visit_us')}
                onMouseLeave={handleMouseLeaveDropdown}
                onClick={(e) => e.stopPropagation()}
                className="absolute top-full left-0 pt-2 w-56 z-50 animate-slide-up before:content-[''] before:absolute before:-top-2 before:left-0 before:right-0 before:h-3"
              >
                <div className="bg-stone-900 border border-stone-800 rounded-xl shadow-2xl p-2 space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveDropdown(null);
                      onOpenVisitUs('location');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs text-stone-200 hover:bg-amber-400/10 hover:text-amber-300 transition-colors cursor-pointer"
                  >
                    <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <span className="font-bold block text-white">Location</span>
                      <span className="text-[10px] text-stone-400 block normal-case font-normal">
                        Connaught Place, New Delhi
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDropdown(null);
                      onOpenVisitUs('about_us');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs text-stone-200 hover:bg-amber-400/10 hover:text-amber-300 transition-colors cursor-pointer"
                  >
                    <Compass className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <span className="font-bold block text-white">About Us</span>
                      <span className="text-[10px] text-stone-400 block normal-case font-normal">
                        Our Story · Brand New 2026 Hotel
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 5. HELP (FAQs, Contact, Allergen Guide, Careers) */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnterDropdown('help')}
            onMouseLeave={handleMouseLeaveDropdown}
          >
            <button
              type="button"
              onClick={(e) => handleDropdownToggle('help', e)}
              className={`flex items-center gap-1 px-2.5 lg:px-3 py-1.5 lg:py-2 rounded-lg transition-colors cursor-pointer select-none ${
                activeDropdown === 'help'
                  ? 'text-amber-400 bg-stone-800 ring-1 ring-amber-400/40'
                  : 'hover:text-amber-400 hover:bg-stone-800/60'
              }`}
            >
              <span>Help</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  activeDropdown === 'help' ? 'rotate-180 text-amber-400' : ''
                }`}
              />
            </button>

            {activeDropdown === 'help' && (
              <div
                onMouseEnter={() => handleMouseEnterDropdown('help')}
                onMouseLeave={handleMouseLeaveDropdown}
                onClick={(e) => e.stopPropagation()}
                className="absolute top-full left-0 pt-2 w-60 z-50 animate-slide-up before:content-[''] before:absolute before:-top-2 before:left-0 before:right-0 before:h-3"
              >
                <div className="bg-stone-900 border border-stone-800 rounded-xl shadow-2xl p-2 space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveDropdown(null);
                      onOpenHelp('faqs');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs text-stone-200 hover:bg-amber-400/10 hover:text-amber-300 transition-colors cursor-pointer"
                  >
                    <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <span className="font-bold block text-white">FAQs</span>
                      <span className="text-[10px] text-stone-400 block normal-case font-normal">
                        Dietary, parking & booking questions
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDropdown(null);
                      onOpenHelp('contact');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs text-stone-200 hover:bg-amber-400/10 hover:text-amber-300 transition-colors cursor-pointer"
                  >
                    <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <span className="font-bold block text-white">Contact</span>
                      <span className="text-[10px] text-stone-400 block normal-case font-normal">
                        Concierge phone & message form
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDropdown(null);
                      onOpenHelp('allergen_guide');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs text-stone-200 hover:bg-amber-400/10 hover:text-amber-300 transition-colors cursor-pointer"
                  >
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <span className="font-bold block text-white">Allergen Guide</span>
                      <span className="text-[10px] text-stone-400 block normal-case font-normal">
                        Gluten, dairy, nut & Jain dietary
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDropdown(null);
                      onOpenHelp('careers');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs text-stone-200 hover:bg-amber-400/10 hover:text-amber-300 transition-colors cursor-pointer"
                  >
                    <Briefcase className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <span className="font-bold block text-white">Careers</span>
                      <span className="text-[10px] text-stone-400 block normal-case font-normal">
                        Join our culinary team
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 6. BOOK TABLE (Direct Action) */}
          <button
            type="button"
            onClick={() => {
              setActiveDropdown(null);
              onOpenReservations();
            }}
            className="flex items-center gap-1 px-2.5 lg:px-3 py-1.5 lg:py-2 rounded-lg text-stone-300 hover:text-amber-400 hover:bg-stone-800/60 transition-colors cursor-pointer select-none"
          >
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span>Book Table</span>
          </button>
          </nav>
        )}

        {/* Right Side Actions: When logged in as admin, ONLY shows Profile Section & Hamburger (no call, no cart, no green dot) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Direct Concierge Call Button - Hidden when admin */}
          {!isAdmin && (
            <button
              type="button"
              onClick={onOpenCallToOrder}
              className="flex items-center gap-1 p-2 text-stone-300 hover:text-amber-400 rounded-lg hover:bg-stone-800 transition-colors cursor-pointer text-xs font-semibold"
              title="Call Maheswari Concierge (+91 11 4352 8900)"
              aria-label="Call Maheswari Concierge"
            >
              <Phone className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="hidden lg:inline text-[11px]">Call</span>
            </button>
          )}

          {/* Cart Button - Hidden when admin */}
          {!isAdmin && (
            <button
              type="button"
              onClick={onOpenCart}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer font-medium text-xs ${
                cartCount > 0
                  ? 'bg-amber-400 text-stone-950 font-bold shadow-xs active:scale-95'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              } ${isCartBouncing ? 'ring-2 ring-amber-300 scale-105' : ''}`}
              title="View Food Cart"
              aria-label={`View Cart with ${cartCount} items`}
            >
              <ShoppingBag className="w-4 h-4 shrink-0" />
              <span className="hidden lg:inline text-[11px]">Cart</span>
              {cartCount > 0 && (
                <span className="flex items-center gap-1 font-mono font-bold text-[11px]">
                  <span className="bg-stone-950 text-amber-300 px-1.5 py-0.2 rounded-full min-w-4 text-center">
                    {cartCount}
                  </span>
                  {cartTotal > 0 && <span className="hidden sm:inline">₹{cartTotal}</span>}
                </span>
              )}
            </button>
          )}

          {/* Profile Section:
              When logged in as admin: Always visible on both mobile AND desktop!
              When regular user: visible on laptop/desktop (md+) */}
          <div className={isAdmin ? 'flex items-center' : 'hidden md:flex items-center'}>
            {isAdmin ? (
              <button
                type="button"
                onClick={onOpenAdmin}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold transition-all text-xs cursor-pointer shadow-md shadow-amber-400/20 active:scale-95 group"
                title={`Admin Account: ${user.name || 'Tej Singh Saud'} - Direct to Admin Operations Panel`}
                aria-label="Direct to Admin Operations Panel"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.name || 'Admin'}
                    className="w-5 h-5 rounded-md object-cover ring-1 ring-stone-950 shrink-0"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-md bg-stone-950 text-amber-400 flex items-center justify-center shrink-0">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
                <span className="text-[11px] sm:text-xs font-bold text-stone-950 max-w-[85px] sm:max-w-[130px] truncate uppercase tracking-tight">
                  {user.name?.split(' ')[0] || 'TEJ'} ADMIN
                </span>
                <span className="text-[9px] px-1.5 py-0.2 bg-stone-950 text-amber-300 rounded font-mono font-bold uppercase shrink-0">
                  Panel
                </span>
              </button>
            ) : hasSignedInAndOrdered ? (
              <button
                type="button"
                onClick={onOpenOrders}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-400/40 hover:bg-amber-500/25 transition-all text-xs font-bold cursor-pointer"
                title="View Orders"
                aria-label="View Orders"
              >
                <ClipboardList className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="hidden lg:inline">Orders</span>
                <span className="w-4 h-4 rounded-full bg-amber-400 text-stone-950 font-bold text-[10px] flex items-center justify-center font-mono">
                  {ordersCount}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-stone-800/80 hover:bg-stone-800 text-amber-400 border border-stone-700/80 hover:border-amber-400/50 transition-all text-xs font-semibold cursor-pointer shadow-xs active:scale-95 group"
                title={user.isLoggedIn ? (user.name || 'Member Profile') : 'Sign In / Account'}
                aria-label="Sign In / Account"
              >
                {user.isLoggedIn && user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.name}
                    className="w-4.5 h-4.5 rounded-md object-cover ring-1 ring-amber-400"
                  />
                ) : (
                  <User className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                )}
                <span className="hidden sm:inline text-[11px] text-stone-200 group-hover:text-amber-300">
                  {user.isLoggedIn ? (user.name?.split(' ')[0] || 'Profile') : 'Sign In'}
                </span>
              </button>
            )}
          </div>

          {/* Hamburger Button:
              Visible on ALL screen sizes when admin (nav shows only profile & hamburger),
              OR on mobile (< md) for regular customers */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMobileMenuOpen(!mobileMenuOpen);
            }}
            className={`${
              isAdmin ? 'flex' : 'md:hidden flex'
            } w-8.5 h-8.5 rounded-lg text-amber-300 bg-stone-800/95 hover:bg-stone-800 border border-amber-500/40 hover:border-amber-400 transition-all cursor-pointer shadow-xs active:scale-95 items-center justify-center shrink-0 select-none`}
            aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-drawer"
          >
            {/* 3-Bar Hamburger Icon (No text) */}
            <div className="w-4.5 h-3.5 relative flex flex-col justify-between items-center py-0.5 pointer-events-none">
              <span
                className={`block h-0.5 w-4.5 rounded-full bg-amber-400 transition-all duration-300 ease-in-out origin-center ${
                  mobileMenuOpen ? 'rotate-45 translate-y-1.25 bg-amber-300' : ''
                }`}
              />
              <span
                className={`block h-0.5 w-4.5 rounded-full bg-amber-400 transition-all duration-200 ease-in-out ${
                  mobileMenuOpen ? 'opacity-0 scale-x-0' : 'opacity-100'
                }`}
              />
              <span
                className={`block h-0.5 w-4.5 rounded-full bg-amber-400 transition-all duration-300 ease-in-out origin-center ${
                  mobileMenuOpen ? '-rotate-45 -translate-y-1.25 bg-amber-300' : ''
                }`}
              />
            </div>
          </button>
        </div>
      </div>

      {/* Slide-Over Navigation Drawer Mounted to document.body */}
      {mobileMenuOpen && typeof document !== 'undefined' && createPortal(
        <div id="mobile-nav-drawer" className="fixed inset-0 z-[9999] overflow-hidden" role="dialog" aria-modal="true">
          {/* Backdrop with tap-to-dismiss */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity animate-fadeIn"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer panel */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-8 z-[10000]">
            <div className="w-[82vw] max-w-[320px] bg-stone-900 border-l border-stone-800 shadow-2xl flex flex-col text-stone-100 overflow-hidden animate-slide-left h-full">
              {/* Drawer Header */}
              <div className="p-3.5 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PalaceLogo size="sm" />
                  <div>
                    <h2 className="font-serif-display font-bold text-xs text-amber-300 leading-tight">
                      MAHESWARI RESTAURANT
                    </h2>
                    <span className="text-[9px] text-emerald-400 uppercase tracking-widest font-semibold block">
                      100% Pure Vegetarian
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-8 h-8 rounded-lg bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700 transition-colors flex items-center justify-center cursor-pointer active:scale-95"
                  aria-label="Close navigation menu"
                >
                  <X className="w-4 h-4 text-amber-400" />
                </button>
              </div>

              {/* Scrollable Navigation Body:
                  Contains EXACTLY the navs that are in the top navbar,
                  Sub-menus initially hidden; clicking main nav expands sub-menus.
                  Sign In pop-up is CONSEQUENT to the menus (compact row in the flow, not taking large bottom space) */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2 text-sm font-sans-body">
                {/* 1. MENU */}
                <div className="rounded-xl border border-stone-800 bg-stone-950/50 overflow-hidden transition-all">
                  <button
                    type="button"
                    onClick={() => setOpenMobileNav((prev) => (prev === 'menu' ? null : 'menu'))}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-stone-800/60 text-left transition-colors cursor-pointer select-none"
                    aria-expanded={openMobileNav === 'menu'}
                  >
                    <div className="flex items-center gap-2.5">
                      <Coffee className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="font-bold text-xs uppercase tracking-wider text-stone-100">Menu</span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-stone-400 transition-transform duration-200 ${
                        openMobileNav === 'menu' ? 'rotate-180 text-amber-400' : ''
                      }`}
                    />
                  </button>

                  {/* Sub-menus: Initially hidden, appear on click */}
                  {openMobileNav === 'menu' && (
                    <div className="px-2 pb-2 space-y-1 animate-slide-up border-t border-stone-800/70 pt-1.5">
                      <button
                        type="button"
                        onClick={() => handleMenuClick('all_day')}
                        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-amber-400/10 hover:text-amber-300 text-left transition-colors cursor-pointer"
                      >
                        <div>
                          <span className="font-bold text-xs text-white block">All Day Menu</span>
                          <span className="text-[10px] text-stone-400">Curries, biryani & tandoor</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-stone-500" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMenuClick('lunch')}
                        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-amber-400/10 hover:text-amber-300 text-left transition-colors cursor-pointer"
                      >
                        <div>
                          <span className="font-bold text-xs text-white block">Lunch Menu</span>
                          <span className="text-[10px] text-stone-400">Royal Thalis & express bowls</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-stone-500" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMenuClick('bar')}
                        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-amber-400/10 hover:text-amber-300 text-left transition-colors cursor-pointer"
                      >
                        <div>
                          <span className="font-bold text-xs text-white block">Bar Menu</span>
                          <span className="text-[10px] text-stone-400">Cocktails, beers & spirits</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-stone-500" />
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. EXPLORE */}
                <div className="rounded-xl border border-stone-800 bg-stone-950/50 overflow-hidden transition-all">
                  <button
                    type="button"
                    onClick={() => setOpenMobileNav((prev) => (prev === 'explore' ? null : 'explore'))}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-stone-800/60 text-left transition-colors cursor-pointer select-none"
                    aria-expanded={openMobileNav === 'explore'}
                  >
                    <div className="flex items-center gap-2.5">
                      <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="font-bold text-xs uppercase tracking-wider text-stone-100">Explore</span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-stone-400 transition-transform duration-200 ${
                        openMobileNav === 'explore' ? 'rotate-180 text-amber-400' : ''
                      }`}
                    />
                  </button>

                  {/* Sub-menus: Initially hidden, appear on click */}
                  {openMobileNav === 'explore' && (
                    <div className="px-2 pb-2 space-y-1 animate-slide-up border-t border-stone-800/70 pt-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          onOpenExplore('gallery');
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-amber-400/10 hover:text-amber-300 text-left transition-colors cursor-pointer"
                      >
                        <div>
                          <span className="font-bold text-xs text-white block">Gallery</span>
                          <span className="text-[10px] text-stone-400">Palace & dining photos</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-stone-500" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          onOpenExplore('buffet_vs_thali');
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-amber-400/10 hover:text-amber-300 text-left transition-colors cursor-pointer"
                      >
                        <div>
                          <span className="font-bold text-xs text-white block">Buffet vs. Thali</span>
                          <span className="text-[10px] text-stone-400">Comparison & dining guide</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-stone-500" />
                      </button>
                    </div>
                  )}
                </div>

                {/* 3. QUICK LINKS */}
                <div className="rounded-xl border border-stone-800 bg-stone-950/50 overflow-hidden transition-all">
                  <button
                    type="button"
                    onClick={() => setOpenMobileNav((prev) => (prev === 'quick_links' ? null : 'quick_links'))}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-stone-800/60 text-left transition-colors cursor-pointer select-none"
                    aria-expanded={openMobileNav === 'quick_links'}
                  >
                    <div className="flex items-center gap-2.5">
                      <ShoppingBag className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="font-bold text-xs uppercase tracking-wider text-stone-100">Quick Links</span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-stone-400 transition-transform duration-200 ${
                        openMobileNav === 'quick_links' ? 'rotate-180 text-amber-400' : ''
                      }`}
                    />
                  </button>

                  {/* Sub-menus: Initially hidden, appear on click */}
                  {openMobileNav === 'quick_links' && (
                    <div className="px-2 pb-2 space-y-1 animate-slide-up border-t border-stone-800/70 pt-1.5">
                      {onOpenQrScanner && (
                        <button
                          type="button"
                          onClick={() => {
                            setMobileMenuOpen(false);
                            onOpenQrScanner();
                          }}
                          className="w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors cursor-pointer bg-amber-400/10 hover:bg-amber-400/20 text-amber-300"
                        >
                          <div className="flex items-center gap-2">
                            <QrCode className="w-4 h-4 shrink-0 text-amber-400" />
                            <div>
                              <span className="font-bold text-xs block text-stone-200">
                                Table QR Stands & Table Selector
                              </span>
                              <span className="text-[10px] text-stone-400">
                                View acrylic table stands & select table
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-stone-500" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          onOpenCart();
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-amber-400/10 hover:text-amber-300 text-left transition-colors cursor-pointer"
                      >
                        <div>
                          <span className="font-bold text-xs text-white block">Order Online</span>
                          <span className="text-[10px] text-stone-400">Takeout & direct delivery</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-stone-500" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          onOpenReservations();
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-amber-400/10 hover:text-amber-300 text-left transition-colors cursor-pointer"
                      >
                        <div>
                          <span className="font-bold text-xs text-white block">Reservations</span>
                          <span className="text-[10px] text-stone-400">Book dining hall tables</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-stone-500" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          onOpenCatering();
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-amber-400/10 hover:text-amber-300 text-left transition-colors cursor-pointer"
                      >
                        <div>
                          <span className="font-bold text-xs text-white block">Catering</span>
                          <span className="text-[10px] text-stone-400">Events & live tandoor</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-stone-500" />
                      </button>
                    </div>
                  )}
                </div>

                {/* 4. VISIT US */}
                <div className="rounded-xl border border-stone-800 bg-stone-950/50 overflow-hidden transition-all">
                  <button
                    type="button"
                    onClick={() => setOpenMobileNav((prev) => (prev === 'visit_us' ? null : 'visit_us'))}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-stone-800/60 text-left transition-colors cursor-pointer select-none"
                    aria-expanded={openMobileNav === 'visit_us'}
                  >
                    <div className="flex items-center gap-2.5">
                      <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="font-bold text-xs uppercase tracking-wider text-stone-100">Visit Us</span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-stone-400 transition-transform duration-200 ${
                        openMobileNav === 'visit_us' ? 'rotate-180 text-amber-400' : ''
                      }`}
                    />
                  </button>

                  {/* Sub-menus: Initially hidden, appear on click */}
                  {openMobileNav === 'visit_us' && (
                    <div className="px-2 pb-2 space-y-1 animate-slide-up border-t border-stone-800/70 pt-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          onOpenVisitUs('location');
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-amber-400/10 hover:text-amber-300 text-left transition-colors cursor-pointer"
                      >
                        <div>
                          <span className="font-bold text-xs text-white block">Location</span>
                          <span className="text-[10px] text-stone-400">Connaught Place, New Delhi</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-stone-500" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          onOpenVisitUs('about_us');
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-amber-400/10 hover:text-amber-300 text-left transition-colors cursor-pointer"
                      >
                        <div>
                          <span className="font-bold text-xs text-white block">About Us</span>
                          <span className="text-[10px] text-stone-400">Our Story · Brand New 2026 Hotel</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-stone-500" />
                      </button>
                    </div>
                  )}
                </div>

                {/* 5. HELP */}
                <div className="rounded-xl border border-stone-800 bg-stone-950/50 overflow-hidden transition-all">
                  <button
                    type="button"
                    onClick={() => setOpenMobileNav((prev) => (prev === 'help' ? null : 'help'))}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-stone-800/60 text-left transition-colors cursor-pointer select-none"
                    aria-expanded={openMobileNav === 'help'}
                  >
                    <div className="flex items-center gap-2.5">
                      <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="font-bold text-xs uppercase tracking-wider text-stone-100">Help</span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-stone-400 transition-transform duration-200 ${
                        openMobileNav === 'help' ? 'rotate-180 text-amber-400' : ''
                      }`}
                    />
                  </button>

                  {/* Sub-menus: Initially hidden, appear on click */}
                  {openMobileNav === 'help' && (
                    <div className="px-2 pb-2 space-y-1 animate-slide-up border-t border-stone-800/70 pt-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          onOpenHelp('faqs');
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-amber-400/10 hover:text-amber-300 text-left transition-colors cursor-pointer"
                      >
                        <div>
                          <span className="font-bold text-xs text-white block">FAQs</span>
                          <span className="text-[10px] text-stone-400">Dietary, parking & booking answers</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-stone-500" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          onOpenHelp('contact');
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-amber-400/10 hover:text-amber-300 text-left transition-colors cursor-pointer"
                      >
                        <div>
                          <span className="font-bold text-xs text-white block">Contact</span>
                          <span className="text-[10px] text-stone-400">Concierge phone & message form</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-stone-500" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          onOpenHelp('allergen_guide');
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-amber-400/10 hover:text-amber-300 text-left transition-colors cursor-pointer"
                      >
                        <div>
                          <span className="font-bold text-xs text-white block">Allergen Guide</span>
                          <span className="text-[10px] text-stone-400">Gluten, dairy, nut & Jain matrix</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-stone-500" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          onOpenHelp('careers');
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-amber-400/10 hover:text-amber-300 text-left transition-colors cursor-pointer"
                      >
                        <div>
                          <span className="font-bold text-xs text-white block">Careers</span>
                          <span className="text-[10px] text-stone-400">Join our culinary team</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-stone-500" />
                      </button>
                    </div>
                  )}
                </div>

                {/* 6. BOOK TABLE (Direct Action) */}
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenReservations();
                  }}
                  className="w-full p-2.5 rounded-xl bg-stone-950/50 hover:bg-stone-800/60 border border-stone-800 text-stone-100 hover:text-amber-300 flex items-center justify-between text-xs font-semibold cursor-pointer active:scale-98 transition-colors select-none"
                >
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="font-bold text-xs uppercase tracking-wider">Book Table</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-500" />
                </button>

                {/* Authenticated Admin Portal: ONLY rendered if authorized admin signs in */}
                {user.isLoggedIn && isAdminUser(user) && (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAdmin?.();
                    }}
                    className="w-full p-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400 text-amber-300 flex items-center justify-between text-xs font-semibold cursor-pointer active:scale-98 transition-colors select-none"
                  >
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="font-bold text-xs uppercase tracking-wider">Admin Operations Console</span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-amber-400 text-stone-950 font-bold text-[9px] uppercase font-mono">
                      Live
                    </span>
                  </button>
                )}

                {/* DISTANCE SEPARATOR: Clearly distinguishes account action from standard navigation links */}
                <div className="pt-3 mt-3 border-t border-stone-800/80">
                  {/* SIGN IN / PROFILE: Distinct color, popping out with royal gold gradient, yet compact and well-proportioned */}
                  {hasSignedInAndOrdered ? (
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenOrders();
                      }}
                      className="w-full p-2.5 rounded-xl bg-gradient-to-r from-amber-500/25 via-amber-400/20 to-amber-600/15 hover:from-amber-500/30 border border-amber-400/60 shadow-md shadow-amber-500/10 flex items-center justify-between cursor-pointer active:scale-98 transition-all select-none group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-400 text-stone-950 flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                          <ClipboardList className="w-4 h-4 stroke-[2.5]" />
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="font-bold text-xs text-amber-200 group-hover:text-amber-100">
                            Active Orders ({ordersCount})
                          </span>
                          <span className="text-[10px] text-amber-400/80 font-medium">
                            Track live food preparation
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  ) : user.isLoggedIn ? (
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        if (isAdminUser(user)) {
                          onOpenAdmin?.();
                        } else {
                          onOpenAuth();
                        }
                      }}
                      className="w-full p-2.5 rounded-xl bg-gradient-to-r from-amber-500/25 via-amber-400/20 to-amber-600/15 hover:from-amber-500/30 border border-amber-400/60 shadow-md shadow-amber-500/10 flex items-center justify-between cursor-pointer active:scale-98 transition-all select-none group"
                    >
                      <div className="flex items-center gap-2.5">
                        {user.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt={user.name}
                            className="w-8 h-8 rounded-lg object-cover ring-2 ring-amber-400 shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-amber-400 text-stone-950 flex items-center justify-center font-bold shadow-xs shrink-0">
                            <User className="w-4 h-4 stroke-[2.5]" />
                          </div>
                        )}
                        <div className="flex flex-col text-left">
                          <span className="font-bold text-xs text-amber-200 group-hover:text-amber-100 uppercase">
                            {isAdminUser(user) ? `${user.name?.split(' ')[0] || 'TEJ'} ADMIN` : (user.name || 'Member Profile')}
                          </span>
                          <span className="text-[10px] text-amber-400/80 font-medium">
                            {isAdminUser(user) ? 'Direct to Admin Operations Console' : 'Royal Palace VIP Member'}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenAuth();
                      }}
                      className="w-full p-2.5 rounded-xl bg-gradient-to-r from-amber-500/25 via-amber-400/15 to-amber-600/20 hover:from-amber-500/35 hover:to-amber-500/25 border-2 border-amber-400/70 shadow-lg shadow-amber-500/15 flex items-center justify-between cursor-pointer active:scale-98 transition-all select-none group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 text-stone-950 flex items-center justify-center shadow-md shadow-amber-400/25 shrink-0 group-hover:scale-105 transition-transform">
                          <User className="w-4 h-4 stroke-[2.5]" />
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="font-serif-display font-bold text-xs text-amber-200 group-hover:text-white leading-tight">
                            Sign In / Member Profile
                          </span>
                          <span className="text-[10px] text-amber-400/90 font-medium leading-tight">
                            Earn royal dining rewards
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-amber-400 text-stone-950 text-[10px] font-bold uppercase tracking-wider shadow-xs group-hover:bg-amber-300 transition-colors">
                        Login
                      </span>
                    </button>
                  )}

                  {/* CALL CONCIERGE: Subordinate quick contact row */}
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenCallToOrder();
                    }}
                    className="w-full mt-2 p-2 rounded-lg bg-stone-950/40 hover:bg-stone-800/60 border border-stone-800/80 text-stone-300 hover:text-amber-300 flex items-center justify-between text-xs font-medium cursor-pointer active:scale-98 transition-colors select-none"
                  >
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="text-[11px]">Concierge: +91 11 4352 8900</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-stone-500" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
};
