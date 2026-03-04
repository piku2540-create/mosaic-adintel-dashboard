import { Router } from 'express';
import { getAdsFiltered, getCachedInsights, setCachedInsights } from '../store.js';
import {
  computeBrandSummaries,
  getLongevityAds,
  detectGaps,
  generateAIInsights,
  computeCreativeStrength,
  computeAggressionScore,
  computeEmotionFormatMatrix,
  computePainOfferAlignment,
} from '../services/insightService.js';

const router = Router();

router.get('/summaries', (req, res) => {
  const brands = req.query.brands ? String(req.query.brands).split(',').filter(Boolean) : [];
  const adTypes = req.query.adTypes ? String(req.query.adTypes).split(',').filter(Boolean) : [];
  const adType = req.query.adType ? String(req.query.adType).split(',').filter(Boolean) : [];
  const messageThemes = req.query.messageThemes
    ? String(req.query.messageThemes).split(',').filter(Boolean)
    : [];
  const dateFrom = (req.query.dateFrom as string) || undefined;
  const dateTo = (req.query.dateTo as string) || undefined;
  const mosaicBrandCategory = (req.query.mosaicBrandCategory as string) || undefined;

  const ads = getAdsFiltered({
    brands,
    adTypes,
    adType,
    messageThemes,
    dateFrom,
    dateTo,
    mosaicBrandCategory,
  });

  const summaries = computeBrandSummaries(ads, brands);
  res.json({ summaries });
});

router.get('/longevity', (req, res) => {
  const brands = req.query.brands ? String(req.query.brands).split(',').filter(Boolean) : [];
  const adTypes = req.query.adTypes ? String(req.query.adTypes).split(',').filter(Boolean) : [];
  const adType = req.query.adType ? String(req.query.adType).split(',').filter(Boolean) : [];
  const messageThemes = req.query.messageThemes
    ? String(req.query.messageThemes).split(',').filter(Boolean)
    : [];
  const dateFrom = (req.query.dateFrom as string) || undefined;
  const dateTo = (req.query.dateTo as string) || undefined;
  const mosaicBrandCategory = (req.query.mosaicBrandCategory as string) || undefined;
  const top = Math.min(Number(req.query.top) || 20, 50);

  const ads = getAdsFiltered({
    brands,
    adTypes,
    adType,
    messageThemes,
    dateFrom,
    dateTo,
    mosaicBrandCategory,
  });

  const longevity = getLongevityAds(ads, top, brands);
  res.json({
    items: longevity.map((l) => ({
      ...l,
      ad: (() => {
        const { _raw, ...a } = l.ad;
        return a;
      })(),
    })),
  });
});

router.get('/gaps', (req, res) => {
  const brands = req.query.brands ? String(req.query.brands).split(',').filter(Boolean) : [];
  const adTypes = req.query.adTypes ? String(req.query.adTypes).split(',').filter(Boolean) : [];
  const adType = req.query.adType ? String(req.query.adType).split(',').filter(Boolean) : [];
  const messageThemes = req.query.messageThemes
    ? String(req.query.messageThemes).split(',').filter(Boolean)
    : [];
  const dateFrom = (req.query.dateFrom as string) || undefined;
  const dateTo = (req.query.dateTo as string) || undefined;
  const mosaicBrandCategory = (req.query.mosaicBrandCategory as string) || undefined;

  const ads = getAdsFiltered({
    brands,
    adTypes,
    adType,
    messageThemes,
    dateFrom,
    dateTo,
    mosaicBrandCategory,
  });

  const summaries = computeBrandSummaries(ads, brands);
  const gaps = detectGaps(ads);
  res.json({ gaps });
});

router.get('/ai', async (req, res) => {
  const brands = req.query.brands ? String(req.query.brands).split(',').filter(Boolean) : [];
  const adTypes = req.query.adTypes ? String(req.query.adTypes).split(',').filter(Boolean) : [];
  const adType = req.query.adType ? String(req.query.adType).split(',').filter(Boolean) : [];
  const messageThemes = req.query.messageThemes
    ? String(req.query.messageThemes).split(',').filter(Boolean)
    : [];
  const dateFrom = (req.query.dateFrom as string) || '';
  const dateTo = (req.query.dateTo as string) || '';
  const mosaicBrandCategory = (req.query.mosaicBrandCategory as string) || undefined;
  const period = {
    from: dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    to: dateTo || new Date().toISOString().slice(0, 10),
  };

  const filters = {
    brands,
    adTypes,
    adType,
    messageThemes,
    dateFrom: period.from,
    dateTo: period.to,
    mosaicBrandCategory,
  };
  const filtersKey = JSON.stringify(filters);

  const cached = getCachedInsights(brands, period, filtersKey);
  if (cached && req.query.skipCache !== '1') {
    return res.json(cached);
  }

  const ads = getAdsFiltered(filters);
  const payload = await generateAIInsights(ads, brands, period);
  setCachedInsights(brands, period, payload, filtersKey);
  res.json(payload);
});

function stripRaw<T extends { _raw?: unknown }>(obj: T): Omit<T, '_raw'> {
  const { _raw, ...rest } = obj;
  return rest as Omit<T, '_raw'>;
}

function parseFilters(req: { query: Record<string, unknown> }) {
  const brands = req.query.brands ? String(req.query.brands).split(',').filter(Boolean) : [];
  const adTypes = req.query.adTypes ? String(req.query.adTypes).split(',').filter(Boolean) : [];
  const adType = req.query.adType ? String(req.query.adType).split(',').filter(Boolean) : [];
  const messageThemes = req.query.messageThemes
    ? String(req.query.messageThemes).split(',').filter(Boolean)
    : [];
  const dateFrom = (req.query.dateFrom as string) || undefined;
  const dateTo = (req.query.dateTo as string) || undefined;
  const mosaicBrandCategory = (req.query.mosaicBrandCategory as string) || undefined;
  return { brands, adTypes, adType, messageThemes, dateFrom, dateTo, mosaicBrandCategory };
}

router.get('/creative-strength', (req, res) => {
  const filters = parseFilters(req);
  const ads = getAdsFiltered(filters);
  const result = computeCreativeStrength(ads);
  res.json({
    ...result,
    items: result.items.map((item) => ({
      ad: stripRaw(item.ad),
      creativeStrengthScore: item.creativeStrengthScore,
      creativeStrengthPercentile: item.creativeStrengthPercentile,
    })),
  });
});

router.get('/aggression', (req, res) => {
  const filters = parseFilters(req);
  const ads = getAdsFiltered(filters);
  res.json(computeAggressionScore(ads));
});

router.get('/emotion-format', (req, res) => {
  const filters = parseFilters(req);
  const ads = getAdsFiltered(filters);
  res.json(computeEmotionFormatMatrix(ads));
});

router.get('/pain-offer-alignment', (req, res) => {
  const filters = parseFilters(req);
  const ads = getAdsFiltered(filters);
  res.json(computePainOfferAlignment(ads));
});

export default router;
