import React, { useState } from 'react';
import {
  X,
  Plus,
  Minus,
  Trash2,
  Tag,
  ArrowRight,
  Flame,
  ShoppingBag,
  QrCode
} from 'lucide-react';
import { CartItem, GeofenceState, BookingType } from '../types/restaurant';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  bookingType: BookingType;
  onChangeBookingType?: (type: BookingType) => void;
  geofenceState: GeofenceState;
  deliveryRadiusKm: number;
  discountCode: string;
  appliedDiscount: number;
  onApplyDiscount: (code: string) => boolean;
  onUpdateQuantity: (cartItemId: string, newQuantity: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onProceedToCheckout: () => void;
  onOpenReservations: () => void;
  activeTable?: string | null;
  onOpenQrScanner?: () => void;
}

export const CartDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  cartItems,
  bookingType,
  onChangeBookingType,
  discountCode,
  appliedDiscount,
  onApplyDiscount,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
  activeTable,
  onOpenQrScanner
}) => {
  if (!isOpen) return null;

  const [inputCode, setInputCode] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

  const subtotal = cartItems.reduce((acc, i) => acc + i.itemTotal, 0);
  const gstAmount = Math.round(subtotal * 0.05); // 5% GST
  // Takeaway automatic 10% self-pickup discount
  const takeawayDiscount = bookingType === 'takeaway' ? Math.round(subtotal * 0.1) : 0;
  const effectiveDiscount = Math.max(appliedDiscount, takeawayDiscount);
  const grandTotal = Math.max(0, subtotal + gstAmount - effectiveDiscount);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    setCouponSuccess(null);

    if (!inputCode.trim()) return;

    const ok = onApplyDiscount(inputCode);
    if (ok) {
      setCouponSuccess('Promo code applied successfully!');
      setInputCode('');
    } else {
      setCouponError('Invalid code. Try "SHANKAR20" for 20% off or "TASTE50"');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs font-sans-body">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between z-10 animate-slide-left">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-900 text-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-400 text-stone-950 font-bold flex items-center justify-center font-mono text-sm">
              {cartItems.reduce((acc, i) => acc + i.quantity, 0)}
            </div>
            <div>
              <h2 className="text-base font-serif-display font-semibold text-white">
                Your Dining Bag
              </h2>
              <span className="text-[11px] text-amber-400 capitalize block -mt-0.5 font-medium">
                {bookingType.replace('_', ' ')} Order
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center cursor-pointer"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Experience Mode Switcher inside Cart */}
        <div className="px-4 py-2.5 bg-stone-100 border-b border-stone-200 shrink-0">
          <div className="flex items-center justify-between text-[11px] mb-1 font-semibold text-stone-600">
            <span>Dining Experience:</span>
            <span className="text-amber-800 font-bold uppercase font-mono">
              {bookingType === 'dine_in' ? '🍽️ Table Dine-In (Auto Kitchen)' : '🛍️ Express Takeaway'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1 p-0.5 bg-stone-200/90 rounded-xl">
            {(['dine_in', 'takeaway'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => onChangeBookingType?.(type)}
                className={`py-1.5 text-center text-[11px] font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  bookingType === type
                    ? 'bg-amber-400 text-stone-950 font-bold shadow-xs'
                    : 'text-stone-700 hover:bg-stone-300/60'
                }`}
              >
                <span>{type === 'dine_in' ? '🍽️' : '🛍️'}</span>
                <span className="capitalize">
                  {type === 'dine_in' ? (activeTable ? activeTable : 'Table Dine-In') : 'Counter Takeaway'}
                </span>
              </button>
            ))}
          </div>

          {bookingType === 'dine_in' && (
            <div className="mt-2 p-2.5 rounded-xl bg-amber-50 border border-amber-300 flex items-center justify-between text-xs animate-fadeIn">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-amber-400 text-stone-950 flex items-center justify-center font-bold shrink-0">
                  <QrCode className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <span className="font-bold text-amber-950 block text-xs">
                    {activeTable ? `Seated at ${activeTable}` : 'No Table Selected'}
                  </span>
                  <span className="text-[10px] text-amber-800 block truncate">
                    {activeTable ? 'Order automatically sent to kitchen upon placement' : 'Select or scan your table (1-12) to place order'}
                  </span>
                </div>
              </div>
              {onOpenQrScanner && (
                <button
                  type="button"
                  onClick={onOpenQrScanner}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-400 hover:bg-amber-300 text-stone-950 shrink-0 ml-2 shadow-xs cursor-pointer font-mono"
                >
                  {activeTable ? 'Change' : 'Select Table'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16 space-y-3">
              <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="font-serif-display text-lg font-bold text-stone-800">
                Your Bag is Empty
              </h3>
              <p className="text-xs text-stone-500 max-w-xs">
                Explore our slow-simmered handi curries, clay-tandoor kebabs, and chef specials.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 px-5 py-2.5 text-xs font-bold bg-amber-400 text-stone-950 rounded-xl hover:bg-amber-300 transition-colors cursor-pointer"
              >
                Browse Menu Dishes
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {cartItems.map((item) => (
                <div
                  key={item.cartItemId}
                  className="p-3 bg-stone-50 rounded-2xl border border-stone-200/90 flex gap-3 items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <img
                      src={item.menuItem.image}
                      alt={item.menuItem.name}
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 rounded-xl object-cover shrink-0"
                    />

                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-stone-900 truncate">
                        {item.menuItem.name}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[10px] text-stone-500 flex-wrap">
                        <span className="capitalize">{item.portion}</span>
                        <span>·</span>
                        <span className="flex items-center gap-0.5 text-amber-700">
                          <Flame className="w-2.5 h-2.5" />
                          <span>Spice {item.spiceLevel}/3</span>
                        </span>
                      </div>
                      <div className="font-mono text-xs font-bold text-stone-900 mt-1">
                        ₹{item.itemTotal}
                      </div>
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center bg-white border border-stone-300 rounded-lg shadow-2xs overflow-hidden">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.cartItemId, item.quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center hover:bg-stone-100 text-stone-700 active:scale-95"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center text-xs font-mono font-bold">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.cartItemId, item.quantity + 1)}
                        className="w-7 h-7 flex items-center justify-center hover:bg-stone-100 text-stone-700 active:scale-95"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.cartItemId)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 rounded-md transition-colors"
                      title="Remove item"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Promo Code Input */}
              <div className="pt-2">
                <form onSubmit={handleApply} className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Promo Code (e.g. SHANKAR20)"
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs uppercase placeholder:normal-case font-mono focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3.5 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold hover:bg-stone-800 transition-colors shrink-0"
                  >
                    Apply
                  </button>
                </form>

                {couponSuccess && (
                  <p className="text-[11px] text-emerald-600 font-medium mt-1">
                    {couponSuccess}
                  </p>
                )}
                {couponError && (
                  <p className="text-[11px] text-rose-600 font-medium mt-1">
                    {couponError}
                  </p>
                )}
                {discountCode && !couponSuccess && (
                  <p className="text-[11px] text-emerald-700 font-medium mt-1 flex items-center gap-1">
                    <span>Applied:</span>
                    <span className="font-bold">{discountCode}</span>
                  </p>
                )}
              </div>

              {/* Bill Details Summary */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/90 space-y-2 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span>Items Subtotal</span>
                  <span className="font-mono tabular-nums">₹{subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (5%)</span>
                  <span className="font-mono tabular-nums">₹{gstAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Table & Dining Service</span>
                  <span className="font-mono tabular-nums text-emerald-600 font-semibold">
                    FREE (Complimentary)
                  </span>
                </div>
                {bookingType === 'takeaway' && takeawayDiscount > 0 && (
                  <div className="flex justify-between text-amber-800 bg-amber-50 p-1.5 rounded-lg border border-amber-200/80 font-semibold">
                    <span>Takeaway 10% Special Savings</span>
                    <span className="font-mono tabular-nums">-₹{takeawayDiscount}</span>
                  </div>
                )}
                {appliedDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Promo Coupon Discount</span>
                    <span className="font-mono tabular-nums">-₹{appliedDiscount}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-stone-200 flex justify-between font-bold text-sm text-stone-900">
                  <span>Grand Total</span>
                  <span className="font-mono text-base tabular-nums">₹{grandTotal}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions (Sticky on Mobile) */}
        {cartItems.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-stone-200 bg-white space-y-2">
            <button
              type="button"
              onClick={() => {
                if (bookingType === 'dine_in' && !activeTable && onOpenQrScanner) {
                  onOpenQrScanner();
                  return;
                }
                onProceedToCheckout();
              }}
              className="w-full py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-between transition-all cursor-pointer min-h-[48px] active:scale-[0.99] shadow-lg bg-amber-400 hover:bg-amber-300 text-stone-950 shadow-amber-500/20"
            >
              <div className="flex flex-col text-left">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-stone-800">
                  Total Payable
                </span>
                <span className="font-mono text-base font-black text-stone-950">
                  ₹{grandTotal}
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-bold">
                <span>
                  {bookingType === 'dine_in' && !activeTable
                    ? 'Scan Table QR to Order'
                    : 'Proceed to Checkout'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full text-center py-1.5 text-xs text-stone-500 hover:text-stone-800 font-medium cursor-pointer"
            >
              Add more dishes from menu
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
