import type { AdCreativeType } from '../types/index.js';

export function parseDateFlexible(s: string | undefined): string {
  if (!s?.trim()) return '';
  const input = s.trim();

  // yyyy-mm-dd
  const iso = input.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) {
    const [, y, m, d] = iso;
    const dt = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
    return isNaN(dt.getTime()) ? '' : dt.toISOString().slice(0, 10);
  }

  // dd-mm-yyyy or dd/mm/yyyy
  const dmy = input.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmy) {
    const [, d, m, y] = dmy;
    const dt = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
    return isNaN(dt.getTime()) ? '' : dt.toISOString().slice(0, 10);
  }

  // fallback: Date parser
  const dt = new Date(input);
  return isNaN(dt.getTime()) ? '' : dt.toISOString().slice(0, 10);
}

export function parseBool(s: string | undefined): boolean | undefined {
  if (!s?.trim()) return undefined;
  const v = s.trim().toLowerCase();
  if (['true', 't', 'yes', 'y', '1'].includes(v)) return true;
  if (['false', 'f', 'no', 'n', '0'].includes(v)) return false;
  return undefined;
}

export function normalizeMosaicBrandCategory(s: string): string {
  const v = s.trim().toLowerCase().replace(/\s+/g, ' ');
  if (v === 'man matters') return 'Man Matters';
  if (v === 'bebodywise' || v === 'be bodywise') return 'BeBodywise';
  if (v === 'little joys') return 'Little Joys';
  return s.trim();
}

export function parseAdFormat(s: string | undefined): AdCreativeType {
  if (!s?.trim()) return 'Static';
  const v = s.trim().toLowerCase();
  if (v.includes('video')) return 'Video';
  if (v.includes('carousel')) return 'Carousel';
  if (v.includes('image')) return 'Static';
  return 'Static';
}

function daysBetween(start: string, end: string): number {
  if (!start || !end) return 0;
  const a = new Date(start);
  const b = new Date(end);
  if (isNaN(a.getTime()) || isNaN(b.getTime())) return 0;
  const diff = Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

export function computeDaysLive(input: {
  firstSeen: string;
  lastSeen: string;
  isActive?: boolean;
}): number {
  if (!input.firstSeen) return 0;
  const today = new Date().toISOString().slice(0, 10);
  const end = input.isActive ? today : input.lastSeen || today;
  return daysBetween(input.firstSeen, end);
}

