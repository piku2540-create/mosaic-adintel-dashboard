import { Router } from 'express';
import { getAdsFiltered, getUniqueBrands } from '../store.js';

const router = Router();

router.get('/brands', (req, res) => {
  const mosaicBrandCategory =
    (req.query.mosaicBrandCategory as string | undefined) || undefined;
  res.json({ brands: getUniqueBrands(mosaicBrandCategory) });
});

router.get('/', (req, res) => {
  const brands = req.query.brands ? String(req.query.brands).split(',').filter(Boolean) : undefined;
  const adTypes = req.query.adTypes ? String(req.query.adTypes).split(',').filter(Boolean) : undefined;
  const adType = req.query.adType ? String(req.query.adType).split(',').filter(Boolean) : undefined;
  const messageThemes = req.query.messageThemes ? String(req.query.messageThemes).split(',').filter(Boolean) : undefined;
  const dateFrom = req.query.dateFrom as string | undefined;
  const dateTo = req.query.dateTo as string | undefined;
  const mosaicBrandCategory = req.query.mosaicBrandCategory as string | undefined;

  const ads = getAdsFiltered({
    brands,
    adTypes,
    adType,
    messageThemes,
    dateFrom,
    dateTo,
    mosaicBrandCategory,
  });

  res.json({
    ads: ads.map((a) => {
      const { _raw, ...rest } = a;
      return rest;
    }),
    total: ads.length,
  });
});

export default router;
