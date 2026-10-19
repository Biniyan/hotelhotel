/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface HotelTable {
  id: string;
  name: string;
  number: number;
  area: string;
  capacity: number;
  description: string;
}

export const RESTAURANT_TABLES: HotelTable[] = [
  { id: 't1', name: 'Table 1', number: 1, area: 'Window Gallery', capacity: 2, description: 'Quiet window view with Connaught Place lights' },
  { id: 't2', name: 'Table 2', number: 2, area: 'Royal Baithak Hall', capacity: 4, description: 'Plush velvet sofa seating for family dining' },
  { id: 't3', name: 'Table 3', number: 3, area: 'Heritage Alcove', capacity: 4, description: 'Intimate arched alcove dining' },
  { id: 't4', name: 'Table 4', number: 4, area: 'Center Grand Hall', capacity: 6, description: 'Spacious central dining table under crystal chandelier' },
  { id: 't5', name: 'Table 5', number: 5, area: 'Garden Courtyard', capacity: 4, description: 'Open-air green courtyard ambience' },
  { id: 't6', name: 'Table 6', number: 6, area: 'Executive Booth', capacity: 6, description: 'Private high-back booth for business luncheons' },
  { id: 't7', name: 'Table 7', number: 7, area: 'Maharaja Baithak VIP', capacity: 8, description: 'Grand heritage royal seating for celebrations' },
  { id: 't8', name: 'Table 8', number: 8, area: 'Royal Fountain Courtyard', capacity: 4, description: 'Beside the Rajasthani marble water fountain' },
  { id: 't9', name: 'Table 9', number: 9, area: 'Imperial Banquet Alcove', capacity: 10, description: 'Large table for groups and celebrations' },
  { id: 't10', name: 'Table 10', number: 10, area: 'Mezzanine Terrace', capacity: 4, description: 'Elevated mezzanine view overlooking central hall' },
  { id: 't11', name: 'Table 11', number: 11, area: 'Rooftop Gazebo', capacity: 4, description: 'Breezy rooftop canopy dining' },
  { id: 't12', name: 'Table 12', number: 12, area: 'Presidential Suite Table', capacity: 6, description: 'Exclusive VIP dining room table' },
];

/**
 * Normalizes any table input from external camera apps, QR readers, URL parameters, or manual typing.
 * Examples:
 * - "5" -> "Table 5"
 * - "Table 5" -> "Table 5"
 * - "table-5" -> "Table 5"
 * - "t05" -> "Table 5"
 * - "T-4" -> "Table 4"
 * - "VIP-1" -> "Table VIP-1"
 */
export function normalizeTableIdentifier(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let clean = decodeURIComponent(raw).trim();
  clean = clean.replace(/^["']|["']$/g, '').trim();
  if (!clean) return null;

  // If already starts with "Table X"
  if (/^table\s+\d+/i.test(clean)) {
    const num = clean.replace(/^table\s+/i, '').trim();
    return `Table ${parseInt(num, 10)}`;
  }

  // If "Table-5" or "table_5"
  if (/^table[-_]\d+/i.test(clean)) {
    const num = clean.replace(/^table[-_]/i, '').trim();
    return `Table ${parseInt(num, 10)}`;
  }

  // If "T-5", "T5", "t05"
  if (/^t-?\d+/i.test(clean)) {
    const num = clean.replace(/^t-?/i, '').trim();
    return `Table ${parseInt(num, 10)}`;
  }

  // Pure digits: "5", "05", "12"
  if (/^\d+$/.test(clean)) {
    return `Table ${parseInt(clean, 10)}`;
  }

  // If it already has Table prefix for named tables (e.g. Table VIP)
  if (/^table\s+/i.test(clean)) {
    return clean;
  }

  return `Table ${clean}`;
}

/**
 * Auto-detects table parameter from any external app scan or browser link:
 * Checks search parameters (?table=, ?t=, ?tableno=, ?tbl=, ?table_id=)
 * Checks URL hash (#table=5, #t=5, #table-5)
 * Checks URL pathname (/table/5)
 * Fallback to sessionStorage / localStorage
 */
export function detectTableFromUrl(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const searchParams = new URLSearchParams(window.location.search);
    const tableKeys = ['table', 't', 'tbl', 'tableno', 'table_id', 'tableNo', 'tableNumber', 'table_no'];
    for (const key of tableKeys) {
      const val = searchParams.get(key);
      if (val) {
        const normalized = normalizeTableIdentifier(val);
        if (normalized) {
          saveActiveTableToStorage(normalized);
          return normalized;
        }
      }
    }

    // Check hash (e.g. #table=5, #table-5, #t=5)
    const hash = window.location.hash || '';
    const hashMatch = hash.match(/(?:table|tbl|t)[=-]([a-zA-Z0-9_\s%+-]+)/i);
    if (hashMatch && hashMatch[1]) {
      const normalized = normalizeTableIdentifier(hashMatch[1]);
      if (normalized) {
        saveActiveTableToStorage(normalized);
        return normalized;
      }
    }

    // Check pathname (e.g. /table/5)
    const pathMatch = window.location.pathname.match(/\/table\/([a-zA-Z0-9_\s%+-]+)/i);
    if (pathMatch && pathMatch[1]) {
      const normalized = normalizeTableIdentifier(pathMatch[1]);
      if (normalized) {
        saveActiveTableToStorage(normalized);
        return normalized;
      }
    }

    // Check storage persistence
    const stored =
      sessionStorage.getItem('maheswari_hotel_table') ||
      localStorage.getItem('maheswari_hotel_table');
    if (stored) {
      return normalizeTableIdentifier(stored);
    }
  } catch (e) {
    console.warn('Table auto-detection notice:', e);
  }

  return null;
}

export function saveActiveTableToStorage(tableName: string) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem('maheswari_hotel_table', tableName);
    localStorage.setItem('maheswari_hotel_table', tableName);
  } catch {}
}

export function clearActiveTableFromStorage() {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem('maheswari_hotel_table');
    localStorage.removeItem('maheswari_hotel_table');
  } catch {}
}
