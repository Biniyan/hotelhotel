import React from 'react';
import {
  Sparkles,
  ShoppingBag,
  Calendar,
  Star,
  Flame,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { BookingType } from '../types/restaurant';
import { RESTAURANT_HERO_IMAGE } from '../data/menuData';

interface Props {
  bookingType: BookingType;
  onChangeBookingType: (type: BookingType) => void;
  onOpenReservations: () => void;
  onScrollToMenu: () => void;
  activeTable?: string | null;
  onOpenQrScanner?: () => void;
}

export const HeroSection: React.FC<Props> = ({
  bookingType,
  onChangeBookingType,
  onOpenReservations,
  onScrollToMenu,
  activeTable,
  onOpenQrScanner
}) => {
  return (
    <section className="relative bg-stone-950 text-stone-100 overflow-hidden font-sans-body border-b border-stone-800/80">
      {/* Background Hero Image with atmospheric royal lighting */}
      <div className="absolute inset-0 pointer-events-none">
        <img
          src={RESTAURANT_HERO_IMAGE}
          alt="MAHESWARI MULTI CUISINE RESTAURANT Pure Veg Dining"
          fetchPriority="high"
          loading="eager"
          decoding="async"
          width="1376"
          height="768"
          className="w-full h-full object-cover object-center opacity-30"
          referrerPolicy="no-referrer"
        />
        {/* Cinematic Scrim & Radial Ambient Gold Glow */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/85 to-stone-950/70" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="space-y-3 sm:space-y-4">
          {/* Royal Kicker Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] sm:text-xs font-semibold backdrop-blur-md shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Imperial Multi-Cuisine · Since 1974</span>
          </div>

          {/* Stately Royal Headline */}
          <h1 className="text-xl sm:text-3xl md:text-4xl font-serif-display font-bold text-white tracking-tight leading-tight">
            A Royal Feast of{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-300">
              Imperial Flavors
            </span>{' '}
            & Heritage Dining
          </h1>

          {/* Rich Storytelling Subtitle */}
          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed max-w-2xl">
            Slow-simmered handi curries over charcoal embers, live clay-tandoor breads, fragrant Awadhi dum biryanis, and artisanal pan-Indian delicacies crafted with pure desi ghee in Connaught Place.
          </p>

          {/* Interactive Dining Mode: QR Table Ordering with Automatic Acceptance */}
          <div className="space-y-2 pt-1 max-w-md">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5 font-mono">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>QR Table Ordering · Auto Kitchen Acceptance</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold font-mono bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                Direct to Kitchen
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-stone-900/90 border border-stone-800 shadow-md backdrop-blur-sm">
              <button
                type="button"
                onClick={() => {
                  onChangeBookingType('dine_in');
                  if (!activeTable) onOpenQrScanner?.();
                }}
                className={`py-2 px-2 text-center text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  bookingType === 'dine_in'
                    ? 'bg-amber-400 text-stone-950 font-bold shadow-xs'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800/50'
                }`}
              >
                <span>🍽️</span>
                <span className="font-bold">{activeTable ? activeTable : 'Dine-In Table QR'}</span>
              </button>

              <button
                type="button"
                onClick={() => onChangeBookingType('takeaway')}
                className={`py-2 px-2 text-center text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  bookingType === 'takeaway'
                    ? 'bg-amber-400 text-stone-950 font-bold shadow-xs'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800/50'
                }`}
              >
                <span>🛍️</span>
                <span>Counter Takeaway</span>
              </button>
            </div>

            {/* Direct Table Identification & Selection Card */}
            {bookingType === 'dine_in' && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-400/30 text-left transition-all">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold text-amber-300 block flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      {activeTable ? `Seated at ${activeTable}` : 'No Table Selected Yet'}
                    </span>
                    <p className="text-[10px] text-stone-300 mt-0.5 truncate">
                      {activeTable
                        ? 'Valid orders reach the kitchen automatically. Waiter serves to your seat.'
                        : 'Select your dining table (1–12) or scan your table acrylic QR stand.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={onOpenQrScanner}
                    className="shrink-0 px-2.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-stone-950 text-[11px] font-bold transition-colors cursor-pointer shadow-xs active:scale-95 flex items-center gap-1 font-mono"
                  >
                    <span>{activeTable ? 'Change Table' : 'Select Table'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons: Order Food + Book Royal Table */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1 max-w-md">
            <button
              type="button"
              onClick={onScrollToMenu}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-500 text-stone-950 font-bold rounded-xl transition-all shadow-md shadow-amber-500/20 active:scale-98 cursor-pointer flex items-center justify-center gap-1.5 text-xs sm:text-sm group"
            >
              <ShoppingBag className="w-4 h-4 text-stone-950 group-hover:scale-110 transition-transform" />
              <span>Explore Royal Menu</span>
              <ArrowRight className="w-3.5 h-3.5 text-stone-950 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              type="button"
              onClick={onOpenReservations}
              className="flex-1 px-4 py-2 bg-stone-900/90 hover:bg-stone-800 text-amber-300 hover:text-amber-200 border border-amber-500/30 hover:border-amber-400/60 rounded-xl transition-all shadow-sm active:scale-98 cursor-pointer flex items-center justify-center gap-1.5 text-xs sm:text-sm"
            >
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>Reserve Table</span>
            </button>
          </div>

          {/* Experience Highlights Strip - Ultra-clean, single line, perfectly aligned with less text */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-3 pt-2.5 border-t border-stone-800/80 max-w-md">
            <div className="flex items-center justify-center gap-1 sm:gap-1.5 py-1 px-1.5 rounded-lg bg-stone-900/60 border border-stone-800/80 text-[11px] sm:text-xs text-stone-200">
              <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-400 text-amber-400 shrink-0" />
              <span className="font-semibold truncate">4.95 Rating</span>
            </div>

            <div className="flex items-center justify-center gap-1 sm:gap-1.5 py-1 px-1.5 rounded-lg bg-stone-900/60 border border-stone-800/80 text-[11px] sm:text-xs text-stone-200">
              <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 shrink-0" />
              <span className="font-semibold truncate">Clay Tandoor</span>
            </div>

            <div className="flex items-center justify-center gap-1 sm:gap-1.5 py-1 px-1.5 rounded-lg bg-stone-900/60 border border-stone-800/80 text-[11px] sm:text-xs text-stone-200">
              <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400 shrink-0" />
              <span className="font-semibold truncate">Pure Desi Ghee</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
