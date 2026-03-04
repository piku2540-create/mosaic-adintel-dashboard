/**
 * Core types aligned with user CSV columns.
 * Brand Information, Platform & Ad Details, Messaging & Creative, Conversion.
 */

/** Ad Format from CSV: Video / Image / Carousel (Image mapped to Static internally) */
export type AdCreativeType = 'Static' | 'Video' | 'Carousel';

/** Normalized message theme for charts (CSV "Message Theme" used when provided) */
export type MessageTheme =
  | 'doctor-backed authority'
  | 'UGC/testimonial'
  | 'problem-solution'
  | 'discount/offer'
  | 'community storytelling'
  | 'educational'
  | string; // allow CSV-specific values

/** Ad Type from CSV */
export type AdType = 'UGC' | 'Founder' | 'Testimonial' | 'Explainer' | 'Scientific' | string;

/** Hook Type from CSV */
export type HookType = 'Problem' | 'Bold Claim' | 'Question' | 'Testimonial' | 'Discount' | string;

export type BrandType = 'D2C' | 'FMCG' | 'Global Brand' | 'Marketplace' | 'Health Tech' | string;
export type TypeOfCompetitor = 'Direct' | 'Indirect' | string;
export type TargetAudience = 'Men' | 'Women' | 'Kids' | string;
export type Platform = 'Instagram' | 'Facebook' | string;
export type LandingPageType = 'Product Page' | 'Quiz Funnel' | 'Offer Page' | string;

export interface RawAdRow {
  [key: string]: string | undefined;
}

export interface ParsedAd {
  id: string;
  /** Competitor brand name (from `Competitor_Brand`) */
  brandName: string;
  /** Meta ad identifier (from `Ad_ID`) */
  adId: string;
  /** Video / Image / Carousel (Image → Static) */
  adCreativeType: AdCreativeType;
  adCopy: string;
  headline: string;
  cta: string;
  /**
   * Compatibility: used by date filters & UI.
   * Always set to `adFirstSeenDate` when available.
   */
  startDate: string;
  /**
   * Compatibility: used for UI display.
   * Always set to `adLastSeenDate` when available.
   */
  endDate: string;
  platform: string;
  creativeUrl: string;
  landingPageUrl: string;
  /** Recalculated dynamically from first/last seen + active flag */
  daysLive: number;
  messageTheme: string;
  creativeFormat: string;

  // —— Brand Information ——
  competitorBrand?: string;
  mosaicBrandCategory?: string;
  brandType?: string;
  competitorType?: string;
  targetAudience?: string;

  // —— Platform & Ad Details ——
  adFormat?: string;
  adType?: string;
  monthBucket?: string;

  // —— Messaging & Creative Strategy ——
  hookType?: string;
  hookText?: string;
  primaryPainPoint?: string;
  emotionalTrigger?: string;
  tone?: string;
  scrollStopperType?: string;
  funnelStage?: string;
  offerType?: string;
  visualStyle?: string;
  creatorPresence?: boolean;
  doctorOrExpertFeatured?: boolean;
  communityElement?: boolean;
  memeFormat?: boolean;
  strategicTag?: string;

  // —— Conversion / Landing ——
  landingPageType?: string;

  // —— Longevity columns ——
  adFirstSeenDate?: string;
  adLastSeenDate?: string;
  isCurrentlyActive?: boolean;

  _raw?: RawAdRow;
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

/** For filters/charts when CSV uses free-form Message Theme */
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

// —— Intelligence modules (derived, not stored on ParsedAd) ——

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
  tier: 'Top 25%' | 'High' | 'Medium' | 'Low' | 'Bottom 25%';
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
