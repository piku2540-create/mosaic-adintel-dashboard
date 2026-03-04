/**
 * In-memory store for uploaded ads and weekly snapshots.
 * Can be replaced with DB + Redis for production.
 */

import type { ParsedAd, AIInsightsPayload } from './types/index.js';

const adsStore: ParsedAd[] = [];
const insightsCache: { key: string; payload: AIInsightsPayload }[] = [];
const MAX_CACHED_INSIGHTS = 10;

export function setAds(ads: ParsedAd[]): void {
  adsStore.length = 0;
  adsStore.push(...ads);
}

export function getAds(): ParsedAd[] {
  return [...adsStore];
}

export function getAdsFiltered(filters: {
  brands?: string[];
  adTypes?: string[];
  adType?: string[];
  messageThemes?: string[];
  dateFrom?: string;
  dateTo?: string;
  mosaicBrandCategory?: string;
}): ParsedAd[] {
  const norm = (v: unknown): string =>
    v === null || v === undefined ? '' : String(v).trim().toLowerCase().replace(/\\s+/g, ' ');

  let list = getAds();
  if (filters.mosaicBrandCategory) {
    const target = norm(filters.mosaicBrandCategory);
    list = list.filter((a) => norm(a.mosaicBrandCategory) === target);
  }
  if (filters.brands?.length) {
    list = list.filter((a) => filters.brands!.includes(a.brandName));
  }
  if (filters.adTypes?.length) {
    list = list.filter((a) => filters.adTypes!.includes(a.adCreativeType));
  }
  if (filters.adType?.length) {
    list = list.filter((a) => a.adType && filters.adType!.includes(a.adType));
  }
  if (filters.messageThemes?.length) {
    list = list.filter((a) => filters.messageThemes!.includes(a.messageTheme));
  }
  if (filters.dateFrom) {
    list = list.filter((a) => (a.adFirstSeenDate || a.startDate) >= filters.dateFrom!);
  }
  if (filters.dateTo) {
    list = list.filter((a) => (a.adFirstSeenDate || a.startDate) <= filters.dateTo!);
  }
  return list;
}

export function getUniqueBrands(mosaicBrandCategory?: string): string[] {
  const ads = mosaicBrandCategory
    ? getAdsFiltered({ mosaicBrandCategory })
    : getAds();
  const set = new Set(ads.map((a) => a.brandName));
  return Array.from(set).sort();
}

function insightsCacheKey(
  brands: string[],
  period: { from: string; to: string },
  filtersKey?: string
): string {
  return `${brands.sort().join(',')}|${period.from}|${period.to}|${filtersKey || ''}`;
}

export function getCachedInsights(
  brands: string[],
  period: { from: string; to: string },
  filtersKey?: string
): AIInsightsPayload | null {
  const key = insightsCacheKey(brands, period, filtersKey);
  const found = insightsCache.find((c) => c.key === key);
  return found ? found.payload : null;
}

export function setCachedInsights(
  brands: string[],
  period: { from: string; to: string },
  payload: AIInsightsPayload,
  filtersKey?: string
): void {
  const key = insightsCacheKey(brands, period, filtersKey);
  const idx = insightsCache.findIndex((c) => c.key === key);
  if (idx >= 0) insightsCache.splice(idx, 1);
  insightsCache.unshift({ key, payload });
  if (insightsCache.length > MAX_CACHED_INSIGHTS) insightsCache.pop();
}
