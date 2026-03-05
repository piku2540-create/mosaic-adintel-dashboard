import { Router } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { promises as fs } from 'fs';
import { getAds, getAdsFiltered, getUniqueBrands, setAds } from '../store.js';
import { parseMetaAdsJson } from '../utils/metaAdsJson.js';
const router = Router();
function isRecord(value) {
    return typeof value === 'object' && value !== null;
}
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
async function resolveSampleAdsPath() {
    const candidates = [
        // dev (backend/src/routes -> backend/data)
        path.resolve(__dirname, '..', '..', 'data', 'sample_ads.json'),
        // production where process is started from backend/
        path.resolve(process.cwd(), 'data', 'sample_ads.json'),
        // production where process is started from repo root
        path.resolve(process.cwd(), 'backend', 'data', 'sample_ads.json'),
    ];
    for (const p of candidates) {
        try {
            await fs.access(p);
            return p;
        }
        catch {
            // keep trying
        }
    }
    // Prefer a deterministic path in error messages
    return candidates[0];
}
async function ensureAdsLoadedFromSample() {
    if (getAds().length)
        return;
    const dataPath = await resolveSampleAdsPath();
    const raw = await fs.readFile(dataPath, 'utf8');
    let parsed;
    try {
        parsed = JSON.parse(raw);
    }
    catch {
        throw new Error('Invalid JSON in sample_ads.json');
    }
    const rawAds = Array.isArray(parsed)
        ? parsed
        : isRecord(parsed) && Array.isArray(parsed.data)
            ? parsed.data
            : [];
    if (!rawAds.length) {
        throw new Error('Unexpected JSON shape in sample_ads.json (expected an array, or an object with a data array)');
    }
    const normalized = parseMetaAdsJson(rawAds);
    setAds(normalized);
}
router.get('/brands', (req, res) => {
    const mosaicBrandCategory = req.query.mosaicBrandCategory || undefined;
    void ensureAdsLoadedFromSample().catch(() => {
        // If the sample dataset can't be loaded, fall back to current in-memory state.
        // The client will still be able to upload CSV to populate store.
    });
    res.json({ brands: getUniqueBrands(mosaicBrandCategory) });
});
router.get('/', async (req, res) => {
    const brands = req.query.brands ? String(req.query.brands).split(',').filter(Boolean) : undefined;
    const adTypes = req.query.adTypes ? String(req.query.adTypes).split(',').filter(Boolean) : undefined;
    const adType = req.query.adType ? String(req.query.adType).split(',').filter(Boolean) : undefined;
    const messageThemes = req.query.messageThemes ? String(req.query.messageThemes).split(',').filter(Boolean) : undefined;
    const dateFrom = req.query.dateFrom;
    const dateTo = req.query.dateTo;
    const mosaicBrandCategory = req.query.mosaicBrandCategory;
    try {
        await ensureAdsLoadedFromSample();
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return res.status(500).json({ error: 'Failed to load sample ad dataset', details: message });
    }
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
