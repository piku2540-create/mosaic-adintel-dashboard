const API = '/api';

export interface UploadResponse {
  ok: boolean;
  totalRows: number;
  brands: string[];
}

export interface DashboardFilters {
  brands?: string[];
  adTypes?: string[];
  adType?: string[];
  messageThemes?: string[];
  dateFrom?: string;
  dateTo?: string;
  mosaicBrandCategory?: string;
}

export async function uploadCSV(file: File): Promise<UploadResponse> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API}/upload`, { method: 'POST', body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Upload failed');
  }
  return res.json();
}

export async function getBrands(mosaicBrandCategory?: string): Promise<{ brands: string[] }> {
  const q = new URLSearchParams();
  if (mosaicBrandCategory && mosaicBrandCategory !== 'All') {
    q.set('mosaicBrandCategory', mosaicBrandCategory);
  }
  const suffix = q.toString() ? `?${q.toString()}` : '';
  const res = await fetch(`${API}/ads/brands${suffix}`);
  if (!res.ok) throw new Error('Failed to load brands');
  return res.json();
}

export interface AdsResponse {
  ads: import('@/types').ParsedAd[];
  total: number;
}

export async function getAds(params: DashboardFilters): Promise<AdsResponse> {
  const q = new URLSearchParams();
  if (params.brands?.length) q.set('brands', params.brands.join(','));
  if (params.adTypes?.length) q.set('adTypes', params.adTypes.join(','));
  if (params.adType?.length) q.set('adType', params.adType.join(','));
  if (params.messageThemes?.length) q.set('messageThemes', params.messageThemes.join(','));
  if (params.dateFrom) q.set('dateFrom', params.dateFrom);
  if (params.dateTo) q.set('dateTo', params.dateTo);
  if (params.mosaicBrandCategory && params.mosaicBrandCategory !== 'All') {
    q.set('mosaicBrandCategory', params.mosaicBrandCategory);
  }
  const res = await fetch(`${API}/ads?${q}`);
  if (!res.ok) throw new Error('Failed to load ads');
  return res.json();
}

export async function getSummaries(
  params: DashboardFilters
): Promise<{ summaries: import('@/types').BrandSummary[] }> {
  const q = new URLSearchParams();
  if (params.brands?.length) q.set('brands', params.brands.join(','));
  if (params.adTypes?.length) q.set('adTypes', params.adTypes.join(','));
  if (params.adType?.length) q.set('adType', params.adType.join(','));
  if (params.messageThemes?.length) q.set('messageThemes', params.messageThemes.join(','));
  if (params.dateFrom) q.set('dateFrom', params.dateFrom);
  if (params.dateTo) q.set('dateTo', params.dateTo);
  if (params.mosaicBrandCategory && params.mosaicBrandCategory !== 'All') {
    q.set('mosaicBrandCategory', params.mosaicBrandCategory);
  }
  const suffix = q.toString() ? `?${q.toString()}` : '';
  const res = await fetch(`${API}/insights/summaries${suffix}`);
  if (!res.ok) throw new Error('Failed to load summaries');
  return res.json();
}

export async function getLongevity(
  params: DashboardFilters,
  top = 20
): Promise<{ items: import('@/types').LongevityAd[] }> {
  const q = new URLSearchParams({ top: String(top) });
  if (params.brands?.length) q.set('brands', params.brands.join(','));
  if (params.adTypes?.length) q.set('adTypes', params.adTypes.join(','));
  if (params.adType?.length) q.set('adType', params.adType.join(','));
  if (params.messageThemes?.length) q.set('messageThemes', params.messageThemes.join(','));
  if (params.dateFrom) q.set('dateFrom', params.dateFrom);
  if (params.dateTo) q.set('dateTo', params.dateTo);
  if (params.mosaicBrandCategory && params.mosaicBrandCategory !== 'All') {
    q.set('mosaicBrandCategory', params.mosaicBrandCategory);
  }
  const res = await fetch(`${API}/insights/longevity?${q.toString()}`);
  if (!res.ok) throw new Error('Failed to load longevity');
  return res.json();
}

export async function getGaps(
  params: DashboardFilters
): Promise<{ gaps: import('@/types').GapOpportunity[] }> {
  const q = new URLSearchParams();
  if (params.brands?.length) q.set('brands', params.brands.join(','));
  if (params.adTypes?.length) q.set('adTypes', params.adTypes.join(','));
  if (params.adType?.length) q.set('adType', params.adType.join(','));
  if (params.messageThemes?.length) q.set('messageThemes', params.messageThemes.join(','));
  if (params.dateFrom) q.set('dateFrom', params.dateFrom);
  if (params.dateTo) q.set('dateTo', params.dateTo);
  if (params.mosaicBrandCategory && params.mosaicBrandCategory !== 'All') {
    q.set('mosaicBrandCategory', params.mosaicBrandCategory);
  }
  const suffix = q.toString() ? `?${q.toString()}` : '';
  const res = await fetch(`${API}/insights/gaps${suffix}`);
  if (!res.ok) throw new Error('Failed to load gaps');
  return res.json();
}

export async function getAIInsights(
  params: DashboardFilters,
  skipCache?: boolean
): Promise<import('@/types').AIInsightsPayload> {
  const q = new URLSearchParams();
  if (params.brands?.length) q.set('brands', params.brands.join(','));
  if (params.adTypes?.length) q.set('adTypes', params.adTypes.join(','));
  if (params.adType?.length) q.set('adType', params.adType.join(','));
  if (params.messageThemes?.length) q.set('messageThemes', params.messageThemes.join(','));
  if (params.dateFrom) q.set('dateFrom', params.dateFrom);
  if (params.dateTo) q.set('dateTo', params.dateTo);
  if (params.mosaicBrandCategory && params.mosaicBrandCategory !== 'All') {
    q.set('mosaicBrandCategory', params.mosaicBrandCategory);
  }
  if (skipCache) q.set('skipCache', '1');
  const res = await fetch(`${API}/insights/ai?${q.toString()}`);
  if (!res.ok) throw new Error('Failed to load AI insights');
  return res.json();
}

function buildInsightsParams(params: DashboardFilters): string {
  const q = new URLSearchParams();
  if (params.brands?.length) q.set('brands', params.brands.join(','));
  if (params.adTypes?.length) q.set('adTypes', params.adTypes.join(','));
  if (params.adType?.length) q.set('adType', params.adType.join(','));
  if (params.messageThemes?.length) q.set('messageThemes', params.messageThemes.join(','));
  if (params.dateFrom) q.set('dateFrom', params.dateFrom);
  if (params.dateTo) q.set('dateTo', params.dateTo);
  if (params.mosaicBrandCategory && params.mosaicBrandCategory !== 'All') {
    q.set('mosaicBrandCategory', params.mosaicBrandCategory);
  }
  return q.toString();
}

export async function getCreativeStrength(
  params: DashboardFilters
): Promise<import('@/types').CreativeStrengthResult> {
  const suffix = buildInsightsParams(params);
  const res = await fetch(`${API}/insights/creative-strength${suffix ? `?${suffix}` : ''}`);
  if (!res.ok) throw new Error('Failed to load creative strength');
  return res.json();
}

export async function getAggression(
  params: DashboardFilters
): Promise<import('@/types').CompetitorAggressionResult> {
  const suffix = buildInsightsParams(params);
  const res = await fetch(`${API}/insights/aggression${suffix ? `?${suffix}` : ''}`);
  if (!res.ok) throw new Error('Failed to load aggression');
  return res.json();
}

export async function getEmotionFormat(
  params: DashboardFilters
): Promise<import('@/types').EmotionFormatMatrixResult> {
  const suffix = buildInsightsParams(params);
  const res = await fetch(`${API}/insights/emotion-format${suffix ? `?${suffix}` : ''}`);
  if (!res.ok) throw new Error('Failed to load emotion-format matrix');
  return res.json();
}

export async function getPainOfferAlignment(
  params: DashboardFilters
): Promise<import('@/types').PainOfferAlignmentResult> {
  const suffix = buildInsightsParams(params);
  const res = await fetch(`${API}/insights/pain-offer-alignment${suffix ? `?${suffix}` : ''}`);
  if (!res.ok) throw new Error('Failed to load pain-offer alignment');
  return res.json();
}
