export type AdCreativeType = 'Static' | 'Video' | 'Carousel';

export interface ParsedAd {
  id: string;
  brandName: string;
  adId: string;
  adCreativeType: AdCreativeType;
  adCopy: string;
  headline: string;
  cta: string;
  startDate: string;
  endDate: string;
  platform: string;
  creativeUrl: string;
  landingPageUrl: string;
  daysLive: number;
  messageTheme: string;
  creativeFormat: string;
  competitorBrand?: string;
  mosaicBrandCategory?: string;
  brandType?: string;
  competitorType?: string;
  targetAudience?: string;
  adFormat?: string;
  adType?: string;
  hookType?: string;
  hookText?: string;
  scrollStopperType?: string;
  monthBucket?: string;
  funnelStage?: string;
  primaryPainPoint?: string;
  emotionalTrigger?: string;
  tone?: string;
  landingPageType?: string;
  offerType?: string;
  visualStyle?: string;
  creatorPresence?: boolean;
  doctorOrExpertFeatured?: boolean;
  communityElement?: boolean;
  memeFormat?: boolean;
  strategicTag?: string;
  adFirstSeenDate?: string;
  adLastSeenDate?: string;
  isCurrentlyActive?: boolean;
}

export interface BrandSummary {
  brandName: string;
  totalAds: number;
  byCreativeType: Record<string, number>;
  byMessageTheme: Record<string, number>;
  byCreativeFormat: Record<string, number>;
  byAdType: Record<string, number>;
  byHookType: Record<string, number>;
  avgDaysLive: number;
  longestRunningAd: ParsedAd | null;
}

export interface AIInsightItem {
  type: 'trend' | 'comparison' | 'gap' | 'longevity' | 'summary';
  title: string;
  body: string;
  evidence?: string[];
  metrics?: Record<string, number | string>;
  brand?: string;
}

export interface AIInsightsPayload {
  generatedAt: string;
  period: { from: string; to: string };
  insights: AIInsightItem[];
  weeklyBrief: string[];
}

export interface LongevityAd {
  ad: ParsedAd;
  daysLive: number;
  rank: number;
}

export interface GapOpportunity {
  category:
    | 'creative_format'
    | 'message_theme'
    | 'ad_type'
    | 'emotional_trigger'
    | 'funnel_stage'
    | 'scroll_stopper'
    | 'offer_type'
    | 'tone'
    | 'pain_point'
    | 'cta';
  description: string;
  competitorsUsing: string[];
  opportunity: string;
  confidence: 'high' | 'medium' | 'low';
}

export const CORE_BRANDS = ['Bebodywise', 'Man Matters', 'Little Joys'] as const;

export const MESSAGE_THEME_OPTIONS = [
  'doctor-backed authority',
  'UGC/testimonial',
  'problem-solution',
  'discount/offer',
  'community storytelling',
  'educational',
  'other',
] as const;

export const AD_TYPE_OPTIONS = ['UGC', 'Founder', 'Testimonial', 'Explainer', 'Scientific'] as const;
export const HOOK_TYPE_OPTIONS = ['Problem', 'Bold Claim', 'Question', 'Testimonial', 'Discount'] as const;
export const AD_CREATIVE_TYPES: AdCreativeType[] = ['Static', 'Video', 'Carousel'];

// Intelligence modules (match backend)
export interface CreativeStrengthItem {
  ad: ParsedAd;
  creativeStrengthScore: number;
  creativeStrengthPercentile: number;
}

export interface CreativeStrengthResult {
  items: CreativeStrengthItem[];
  avgByBrand: { brandName: string; avgScore: number }[];
  avgByFormat: { format: string; avgScore: number }[];
  insights: string[];
}

export interface AggressionBrandRow {
  brandName: string;
  totalAds: number;
  avgDaysLive: number;
  pctVideo: number;
  adsPerMonth: number;
  aggressionScore: number;
  tier: string;
}

export interface CompetitorAggressionResult {
  brands: AggressionBrandRow[];
  insights: string[];
}

export interface EmotionFormatCell {
  emotionalTrigger: string;
  adFormat: string;
  avgDaysLive: number;
  count: number;
  pctActive: number;
  flagUnderusedHighLongevity?: boolean;
  flagOverusedLowLongevity?: boolean;
}

export interface EmotionFormatMatrixResult {
  cells: EmotionFormatCell[];
  insights: string[];
}

export interface PainOfferAlignmentRow {
  brandName: string;
  alignedCount: number;
  totalWithPainPoint: number;
  alignmentPct: number;
}

export interface PainOfferAlignmentResult {
  byBrand: PainOfferAlignmentRow[];
  topCombos: { pain: string; offer: string; count: number }[];
  topBrands: PainOfferAlignmentRow[];
  bottomBrands: PainOfferAlignmentRow[];
  insights: string[];
}
