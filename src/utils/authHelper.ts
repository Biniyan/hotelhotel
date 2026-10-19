import { UserProfile, UserRole, DepartmentType } from '../types/restaurant';

export const ADMIN_EMAILS = [
  'militarynp280@gmail.com',
  'tejsinghsaud55@gmail.com',
  'tejsinghsaud70@gmail.com',
  'admin@maheswarirestaurant.com',
];

export interface DepartmentConfig {
  id: DepartmentType;
  title: string;
  hindiTitle: string;
  role: UserRole;
  pin: string;
  description: string;
  hindiDescription: string;
  badgeColor: string;
  allowedTabs: string[];
}

export const DEPARTMENTS: Record<DepartmentType, DepartmentConfig> = {
  manager: {
    id: 'manager',
    title: 'General Manager (Full Access)',
    hindiTitle: 'जनरल मैनेजर (पूर्ण अधिकार)',
    role: 'manager',
    pin: '9900',
    description: 'Master administrative access across KDS, tables, bookings, supply, staff & finance',
    hindiDescription: 'किचन, टेबल, बुकिंग, मेन्यू सप्लाई, स्टाफ एवं वित्त का पूर्ण अधिकार',
    badgeColor: 'bg-amber-400 text-stone-950',
    allowedTabs: ['kds', 'tables', 'reservations', 'menu', 'staff', 'analytics', 'coupons', 'catering', 'settings'],
  },
  kitchen: {
    id: 'kitchen',
    title: 'Kitchen & Master Chef',
    hindiTitle: 'रसोई एवं शेफ कंसोल',
    role: 'kitchen',
    pin: '1122',
    description: 'Incoming live orders, prep queue, cooking status & ready alert dispatcher',
    hindiDescription: 'चालू ऑर्डर, पकाने की स्थिति और तैयार खाना अलर्ट',
    badgeColor: 'bg-orange-500 text-white',
    allowedTabs: ['kds'],
  },
  waiter: {
    id: 'waiter',
    title: 'Dining Floor Waiter',
    hindiTitle: 'वेटर एवं टेबल ऑर्डर फीडिंग',
    role: 'waiter',
    pin: '3344',
    description: 'Punch-in table orders, live food ready pickup alerts, and table service completion',
    hindiDescription: 'टेबल ऑर्डर फीडिंग, खाना तैयार अलर्ट और सर्विंग डिलीवरी',
    badgeColor: 'bg-blue-500 text-white',
    allowedTabs: ['waiter_desk', 'kds', 'tables'],
  },
  booking_menu: {
    id: 'booking_menu',
    title: 'Bookings & Menu Supply Manager',
    hindiTitle: 'बुकिंग व मेन्यू सप्लाई प्रबंधक',
    role: 'booking_menu',
    pin: '5566',
    description: 'Manage dining table bookings, seating arrangements, and live menu stock & 86 items',
    hindiDescription: 'टेबल आरक्षण व्यवस्था एवं मेन्यू स्टॉक व 86 उपलब्धता',
    badgeColor: 'bg-emerald-500 text-white',
    allowedTabs: ['reservations', 'menu', 'tables'],
  },
  delivery: {
    id: 'delivery',
    title: 'Delivery Fleet / Rider',
    hindiTitle: 'डिलीवरी बॉय / राइडर',
    role: 'delivery',
    pin: '7788',
    description: 'Orders ready for delivery, customer address & phone, dispatch, and cash collection',
    hindiDescription: 'डिलीवरी ऑर्डर्स, ग्राहक का पता, फोन और डिलीवरी पूर्ति',
    badgeColor: 'bg-purple-500 text-white',
    allowedTabs: ['delivery_desk'],
  },
};

export const ADMIN_MASTER_PINS = ['2026', '7788', '1234', '9900'];

export function isAuthorizedAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.toLowerCase().trim();
  return (
    ADMIN_EMAILS.some((adm) => adm.toLowerCase().trim() === clean) ||
    clean.includes('tejsinghsaud') ||
    clean === 'admin@maheswarirestaurant.com' ||
    clean.startsWith('admin@')
  );
}

export function getDepartmentByPin(pin: string): DepartmentConfig | null {
  const cleanPin = pin.trim();
  if (['2026', '9900', '1234'].includes(cleanPin)) {
    return DEPARTMENTS.manager;
  }
  for (const dept of Object.values(DEPARTMENTS)) {
    if (dept.pin === cleanPin) {
      return dept;
    }
  }
  return null;
}

export function getUserDepartment(user?: UserProfile | null): DepartmentType {
  if (!user) return 'manager';
  if (user.department && DEPARTMENTS[user.department]) {
    return user.department;
  }
  if (user.role === 'kitchen') return 'kitchen';
  if (user.role === 'waiter' || user.role === 'captain') return 'waiter';
  if (user.role === 'booking_menu') return 'booking_menu';
  if (user.role === 'delivery') return 'delivery';
  return 'manager';
}

export function hasDepartmentPermission(
  department: DepartmentType,
  requiredTab: string
): boolean {
  if (department === 'manager') return true;
  const config = DEPARTMENTS[department];
  if (!config) return false;
  return config.allowedTabs.includes(requiredTab);
}

export function isAdminUser(user?: UserProfile | null): boolean {
  if (!user || !user.isLoggedIn) return false;
  if (user.role === 'admin' || user.role === 'manager') {
    return true;
  }
  if (['kitchen', 'waiter', 'captain', 'booking_menu', 'delivery'].includes(user.role as string)) {
    return true;
  }
  if (user.email && isAuthorizedAdminEmail(user.email)) {
    return true;
  }
  return false;
}

export function verifyAdminPin(pin: string): boolean {
  return ADMIN_MASTER_PINS.includes(pin.trim()) || !!getDepartmentByPin(pin);
}

