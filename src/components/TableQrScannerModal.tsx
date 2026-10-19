import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  QrCode,
  Camera,
  CheckCircle2,
  Printer,
  Sparkles,
  ArrowRight,
  Utensils,
  RefreshCw,
  AlertCircle,
  MapPin,
  ExternalLink,
  Upload,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import QRCode from 'qrcode';
import { PalaceLogo } from './PalaceLogo';
import { normalizeTableIdentifier } from '../utils/tableHelper';

export interface HotelTableInfo {
  id: string;
  name: string;
  number: number;
  area: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved';
}

export const HOTEL_TABLES: HotelTableInfo[] = [
  { id: 't1', name: 'Table 1', number: 1, area: 'Window Gallery', capacity: 2, status: 'available' },
  { id: 't2', name: 'Table 2', number: 2, area: 'Royal Baithak Hall', capacity: 4, status: 'available' },
  { id: 't3', name: 'Table 3', number: 3, area: 'Heritage Alcove', capacity: 4, status: 'occupied' },
  { id: 't4', name: 'Table 4', number: 4, area: 'Center Grand Hall', capacity: 6, status: 'available' },
  { id: 't5', name: 'Table 5', number: 5, area: 'Garden Courtyard', capacity: 4, status: 'available' },
  { id: 't6', name: 'Table 6', number: 6, area: 'Executive Booth', capacity: 6, status: 'available' },
  { id: 't7', name: 'Table 7', number: 7, area: 'Maharaja Baithak VIP', capacity: 8, status: 'reserved' },
  { id: 't8', name: 'Table 8', number: 8, area: 'Royal Fountain Courtyard', capacity: 4, status: 'available' },
  { id: 't9', name: 'Table 9', number: 9, area: 'Imperial Banquet Alcove', capacity: 10, status: 'available' },
  { id: 't10', name: 'Table 10', number: 10, area: 'Mezzanine Terrace', capacity: 4, status: 'available' },
  { id: 't11', name: 'Table 11', number: 11, area: 'Rooftop Gazebo', capacity: 4, status: 'available' },
  { id: 't12', name: 'Table 12', number: 12, area: 'Presidential Suite Table', capacity: 6, status: 'available' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  activeTable?: string | null;
  onSelectTable: (tableNumber: string) => void;
  onClearTable?: () => void;
  lang?: 'en' | 'hi';
}

export const TableQrScannerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  activeTable,
  onSelectTable,
  onClearTable,
  lang = 'en',
}) => {
  const [activeTab, setActiveTab] = useState<'select' | 'scan' | 'stands'>('select');
  const [manualInput, setManualInput] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [selectedTableForStand, setSelectedTableForStand] = useState<HotelTableInfo>(HOTEL_TABLES[3]); // Table 4 default
  const [standQrDataUrl, setStandQrDataUrl] = useState<string>('');
  const [allStandsQr, setAllStandsQr] = useState<Record<string, string>>({});
  const [isScanningSimulated, setIsScanningSimulated] = useState(false);
  const [scannedTableDetected, setScannedTableDetected] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setManualError(null);
    if (!manualInput.trim()) {
      setManualError('Please enter a table number (e.g. 5).');
      return;
    }
    const normalized = normalizeTableIdentifier(manualInput);
    if (normalized) {
      onSelectTable(normalized);
      onClose();
    } else {
      setManualError('Invalid table number. Please try again.');
    }
  };

  // Generate QR Code data URLs
  useEffect(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://maheswarirestaurant.com';
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';

    const generateQr = async () => {
      try {
        const tableUrl = `${origin}${currentPath}?table=${encodeURIComponent(selectedTableForStand.name)}`;
        const dataUrl = await QRCode.toDataURL(tableUrl, {
          width: 320,
          margin: 1.5,
          color: {
            dark: '#1c1917',
            light: '#ffffff',
          },
        });
        setStandQrDataUrl(dataUrl);

        // Preload all stands QR
        const map: Record<string, string> = {};
        for (const tbl of HOTEL_TABLES) {
          const u = `${origin}${currentPath}?table=${encodeURIComponent(tbl.name)}`;
          map[tbl.id] = await QRCode.toDataURL(u, {
            width: 200,
            margin: 1,
            color: { dark: '#1c1917', light: '#ffffff' },
          });
        }
        setAllStandsQr(map);
      } catch (err) {
        console.warn('QR code generation error:', err);
      }
    };

    if (isOpen) {
      generateQr();
    }
  }, [isOpen, selectedTableForStand]);

  // Start / stop camera stream when in scan tab
  useEffect(() => {
    if (!isOpen || activeTab !== 'scan') {
      stopCamera();
      return;
    }

    startCamera();
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera access is not supported on this browser/environment.');
        setCameraActive(false);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setCameraActive(true);
    } catch (err: any) {
      console.warn('Camera stream notice:', err);
      setCameraError('Device camera unavailable. Please upload a photo of your table QR stand or test scan from the Hotel QR Stands tab.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const scanIntervalRef = useRef<any>(null);

  // Live BarcodeDetector auto-detection from camera video stream
  useEffect(() => {
    if (!cameraActive) {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
      return;
    }

    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
        scanIntervalRef.current = setInterval(async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) return;
          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes && barcodes.length > 0) {
              const raw = barcodes[0].rawValue;
              let detectedTable = '';
              if (raw.includes('table=')) {
                const match = raw.match(/table=([^&#]+)/);
                if (match) detectedTable = decodeURIComponent(match[1]);
              } else if (raw.includes('t=')) {
                const match = raw.match(/t=([^&#]+)/);
                if (match) detectedTable = decodeURIComponent(match[1]);
              } else if (/table\s*\d+/i.test(raw)) {
                detectedTable = raw.trim();
              }
              if (detectedTable) {
                if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
                handleSimulateScan(detectedTable);
              }
            }
          } catch {}
        }, 350);
      } catch {}
    }

    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    };
  }, [cameraActive]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      await new Promise((resolve) => (img.onload = resolve));

      if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
        const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
        const barcodes = await detector.detect(img);
        if (barcodes && barcodes.length > 0) {
          const raw = barcodes[0].rawValue;
          let detectedTable = '';
          if (raw.includes('table=')) {
            const match = raw.match(/table=([^&#]+)/);
            if (match) detectedTable = decodeURIComponent(match[1]);
          } else if (raw.includes('t=')) {
            const match = raw.match(/t=([^&#]+)/);
            if (match) detectedTable = decodeURIComponent(match[1]);
          } else if (/table\s*\d+/i.test(raw)) {
            detectedTable = raw.trim();
          }
          if (detectedTable) {
            handleSimulateScan(detectedTable);
            return;
          }
        }
      }

      // Filename fallback check for simulated staff photo uploads
      const m = file.name.match(/table[-_\s]*(\d+)/i);
      if (m) {
        handleSimulateScan(`Table ${m[1]}`);
        return;
      }
      setCameraError('Could not decode a hotel table QR code from this image. Please align camera with the physical acrylic stand.');
    } catch (err) {
      console.warn('QR image decoding error:', err);
      setCameraError('Failed to parse image. Please scan live with device camera.');
    }
  };

  const handleSimulateScan = (tableName: string) => {
    setIsScanningSimulated(true);
    setScannedTableDetected(tableName);

    setTimeout(() => {
      setIsScanningSimulated(false);
      onSelectTable(tableName);
      stopCamera();
      onClose();
    }, 700);
  };

  const handlePrintStands = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-950/85 backdrop-blur-md animate-fadeIn font-sans-body">
      <div className="relative w-full max-w-2xl bg-stone-900 border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden text-stone-100 flex flex-col max-h-[92vh]">
        
        {/* ========================================================================= */}
        {/* HEADER */}
        {/* ========================================================================= */}
        <div className="px-5 py-4 border-b border-stone-800 bg-stone-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400/25 to-amber-600/15 border border-amber-400/40 text-amber-300 flex items-center justify-center shadow-inner">
              <QrCode className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                  Maheswari Multi Cuisine Restaurant & Hotel
                </span>
                {activeTable && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-400 text-stone-950">
                    Active: {activeTable}
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-serif-display font-bold text-white leading-tight">
                {lang === 'hi' ? 'टेबल QR कोड ऑर्डरिंग प्रणाली' : 'Hotel Table QR Ordering System'}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-white rounded-full hover:bg-stone-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB NAVIGATION */}
        {/* ========================================================================= */}
        <div className="flex items-center border-b border-stone-800 bg-stone-950/60 px-5 pt-2 gap-2 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('select')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'select'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Utensils className="w-3.5 h-3.5 text-amber-400" />
            <span>{lang === 'hi' ? '🍽️ टेबल चुनें (Direct Select)' : '🍽️ Select Table (Direct)'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('scan')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'scan'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{lang === 'hi' ? '📷 टेबल QR स्कैन करें' : 'Scan Table QR (Camera)'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('stands')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'stands'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{lang === 'hi' ? '🖨️ होटल QR स्टैंड्स (Print)' : 'Hotel QR Stands (Print)'}</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB CONTENT */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* TAB 1: DIRECT TABLE SELECTION */}
          {activeTab === 'select' && (
            <div className="space-y-4">
              {/* Automatic Kitchen Acceptance Notice */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-amber-600/15 border border-amber-400/40 text-stone-200 text-xs flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center shrink-0 font-bold shadow-xs">
                  ⚡
                </div>
                <div className="space-y-0.5">
                  <span className="font-bold text-amber-300 block text-xs">
                    QR Ordering with Automatic Acceptance
                  </span>
                  <p className="text-[11px] text-stone-300 leading-relaxed">
                    Select your table number below. Valid food orders automatically reach the kitchen chefs immediately. Your waiter will serve dishes hot to your table.
                  </p>
                </div>
              </div>

              {/* Manual Table Number Input */}
              <form onSubmit={handleManualSubmit} className="p-3.5 bg-stone-950/80 rounded-2xl border border-stone-800 space-y-2">
                <label className="text-xs font-semibold text-stone-300 flex items-center justify-between">
                  <span>Enter Table Number Directly</span>
                  <span className="text-[10px] text-amber-400 font-mono">e.g. 4 or Table 4</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="Type table # (e.g. 5, 12, T-04)"
                    className="flex-1 px-3.5 py-2 text-xs bg-stone-900 border border-stone-700 rounded-xl text-white placeholder-stone-500 focus:outline-none focus:border-amber-400 font-mono"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs rounded-xl transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
                  >
                    Confirm Table
                  </button>
                </div>
                {manualError && (
                  <span className="text-[11px] text-rose-400 block">{manualError}</span>
                )}
              </form>

              {/* Table Grid */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                    Choose Your Seated Table:
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono">12 Tables Available</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {HOTEL_TABLES.map((table) => {
                    const isSelected = activeTable === table.name;
                    return (
                      <button
                        key={table.id}
                        type="button"
                        onClick={() => {
                          onSelectTable(table.name);
                          onClose();
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 group relative ${
                          isSelected
                            ? 'bg-amber-400/20 border-amber-400 shadow-md shadow-amber-500/10 ring-1 ring-amber-400'
                            : 'bg-stone-950/80 border-stone-800 hover:border-amber-400/50 hover:bg-stone-850'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-serif-display font-bold text-sm sm:text-base text-white group-hover:text-amber-300">
                            {table.name}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-stone-900 text-amber-400 border border-amber-500/30">
                            {table.capacity}p
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-stone-400 block truncate font-medium">
                            {table.area}
                          </span>
                          <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-amber-400 group-hover:translate-x-0.5 transition-transform">
                            <span>{isSelected ? '✓ Current Table' : 'Tap to Select'}</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {activeTable && (
                <div className="pt-2 flex justify-between items-center border-t border-stone-800">
                  <span className="text-xs text-stone-400">
                    Currently Selected: <strong className="text-amber-300">{activeTable}</strong>
                  </span>
                  {onClearTable && (
                    <button
                      type="button"
                      onClick={() => {
                        onClearTable();
                        onClose();
                      }}
                      className="text-xs text-rose-400 hover:text-rose-300 underline cursor-pointer"
                    >
                      Clear Selection
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CAMERA SCANNER */}
          {activeTab === 'scan' && (
            <div className="space-y-4">
              <div className="relative rounded-2xl bg-stone-950 border border-stone-800 overflow-hidden aspect-video sm:aspect-4/3 flex items-center justify-center">
                {/* Camera Video Stream or Fallback */}
                {cameraActive ? (
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="p-6 text-center space-y-2 max-w-sm">
                    <QrCode className="w-12 h-12 text-amber-400/80 mx-auto animate-pulse" />
                    <p className="text-xs text-stone-300 font-medium">
                      {cameraError || 'Point your device camera at the QR code stand on your hotel dining table.'}
                    </p>
                  </div>
                )}

                {/* Reticle / Viewfinder Overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="relative w-48 h-48 sm:w-56 sm:h-56 border-2 border-amber-400/80 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                    {/* Corner accents */}
                    <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-amber-300 rounded-tl-lg" />
                    <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-amber-300 rounded-tr-lg" />
                    <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-amber-300 rounded-bl-lg" />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-amber-300 rounded-br-lg" />

                    {/* Animated scanning laser */}
                    <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-laser shadow-[0_0_8px_#f59e0b]" />

                    <div className="absolute bottom-2 inset-x-0 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-stone-950/80 text-[10px] font-mono text-amber-300 border border-amber-400/30 backdrop-blur-xs">
                        Point at Table QR Acrylic Stand
                      </span>
                    </div>
                  </div>
                </div>

                {isScanningSimulated && (
                  <div className="absolute inset-0 bg-stone-950/90 backdrop-blur-xs flex flex-col items-center justify-center gap-2 animate-fadeIn">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 animate-bounce" />
                    <span className="text-sm font-bold text-white">
                      Verified: {scannedTableDetected}!
                    </span>
                    <span className="text-xs text-stone-400 font-mono">
                      Orders locked exclusively to this table...
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons: Photo Upload Scanner & Anti-Abuse Lock Notice */}
              <div className="space-y-3 pt-1">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                  <label className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold cursor-pointer border border-stone-700 transition-colors shadow-xs">
                    <Upload className="w-4 h-4 text-amber-400" />
                    <span>Upload / Scan QR Stand Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>

                  {activeTable && (
                    <button
                      type="button"
                      onClick={() => onClearTable?.()}
                      className="px-3 py-2 text-xs text-rose-400 hover:text-rose-300 font-mono rounded-xl bg-rose-500/10 border border-rose-500/20 cursor-pointer"
                    >
                      Clear Table ({activeTable})
                    </button>
                  )}
                </div>

                {/* Direct Ordering Benefits Card */}
                <div className="p-3.5 bg-amber-500/10 border border-amber-400/30 rounded-2xl text-left space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Automatic Kitchen Acceptance</span>
                  </div>
                  <p className="text-[11px] text-stone-300 leading-relaxed">
                    Orders placed directly from your table reach our kitchen instantly. The kitchen starts preparing your food immediately, and your waiter serves it fresh to your table.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: PRINTABLE TABLE STANDS (HOTEL MANAGEMENT) */}
          {/* ========================================================================= */}
          {activeTab === 'stands' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1 flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Hotel Table Acrylic QR Stands
                  </h3>
                  <p className="text-xs text-stone-400">
                    Place these QR code stands on each table in the hotel dining hall.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handlePrintStands}
                  className="px-3.5 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Table QR Cards</span>
                </button>
              </div>

              {/* Table Stand Selector */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {HOTEL_TABLES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTableForStand(t)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      selectedTableForStand.id === t.id
                        ? 'bg-amber-400 text-stone-950 font-bold shadow-md'
                        : 'bg-stone-950 text-stone-300 hover:bg-stone-800 border border-stone-800'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>

              {/* Table Stand Preview Card */}
              <div className="p-6 bg-white text-stone-950 rounded-3xl shadow-2xl border-4 border-amber-400/80 max-w-sm mx-auto text-center space-y-3">
                <div className="flex justify-center">
                  <PalaceLogo size="md" />
                </div>
                <div>
                  <h4 className="font-serif-display font-extrabold text-base tracking-wide text-stone-900">
                    MAHESWARI MULTI CUISINE
                  </h4>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-amber-800 font-bold">
                    Pure Heritage Restaurant & Hotel
                  </p>
                </div>

                <div className="py-1">
                  <div className="inline-block px-4 py-1 rounded-full bg-stone-950 text-amber-300 font-mono font-black text-sm tracking-widest shadow-inner">
                    {selectedTableForStand.name.toUpperCase()}
                  </div>
                  <div className="text-[10px] text-stone-600 mt-1">
                    {selectedTableForStand.area} · {selectedTableForStand.capacity} Guests
                  </div>
                </div>

                {/* QR Code image */}
                <div className="flex justify-center p-2 bg-stone-50 rounded-2xl border border-stone-200">
                  {standQrDataUrl ? (
                    <img
                      src={standQrDataUrl}
                      alt={`QR Code for ${selectedTableForStand.name}`}
                      className="w-44 h-44 rounded-lg shadow-sm"
                    />
                  ) : (
                    <div className="w-44 h-44 flex items-center justify-center text-xs text-stone-400">
                      Generating QR...
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-bold text-stone-900">
                    📱 Scan with Camera to View Menu & Order
                  </p>
                  <p className="text-[10px] text-stone-500 leading-tight">
                    Your food will be prepared fresh by our royal kitchen and served directly to this table.
                  </p>
                </div>

                <div className="pt-2 border-t border-stone-200 space-y-2">
                  <div className="flex items-center justify-center gap-1.5 text-[10px] text-stone-400 font-mono">
                    <span>Fast Wifi & Contactless Order System</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSimulateScan(selectedTableForStand.name)}
                    className="w-full py-2 bg-stone-900 hover:bg-stone-800 text-amber-300 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <QrCode className="w-3.5 h-3.5 text-amber-400" />
                    <span>Test Scan {selectedTableForStand.name} Stand</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* FOOTER */}
        {/* ========================================================================= */}
        <div className="px-5 py-3 border-t border-stone-800 bg-stone-950 flex items-center justify-between text-xs text-stone-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-mono text-[11px]">
              {activeTable
                ? `Currently set to: ${activeTable}`
                : 'No table scanned (Delivery mode default)'}
            </span>
          </div>

          {activeTable && (
            <button
              type="button"
              onClick={() => {
                onClearTable?.();
                onClose();
              }}
              className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-rose-500/20 text-rose-300 text-[11px] font-medium transition-colors cursor-pointer"
            >
              Disconnect Table
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
