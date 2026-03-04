import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { promises as fs } from 'fs';
import uploadRouter from './routes/upload.js';
import adsRouter from './routes/ads.js';
import insightsRouter from './routes/insights.js';
import { getAds as getStoredAds, setAds } from './store.js';
import { parseMetaAdsJson } from './utils/metaAdsJson.js';
const app = express();
app.use(cors({
    origin: (origin, callback) => {
        // Allow non-browser clients (no Origin header), and the local frontend dev server.
        if (!origin)
            return callback(null, true);
        const allowed = new Set(['http://localhost:5173', 'http://127.0.0.1:5173']);
        const isLocal = allowed.has(origin);
        const isRender = origin.includes('onrender.com');
        return isLocal || isRender
            ? callback(null, true)
            : callback(new Error(`CORS blocked origin: ${origin}`));
    },
}));
app.use(express.json());
app.use('/api/upload', uploadRouter);
app.use('/api/ads', adsRouter);
app.use('/api/insights', insightsRouter);
function isRecord(value) {
    return typeof value === 'object' && value !== null;
}
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.get('/api/meta-ads', async (_req, res) => {
    try {
        const dataPath = path.resolve(__dirname, '..', 'data', 'sample_ads.json');
        const [raw, stats] = await Promise.all([fs.readFile(dataPath, 'utf8'), fs.stat(dataPath)]);
        // If the in-memory store already has ads (e.g. from CSV upload),
        // return those so the dashboard stays consistent across endpoints.
        const stored = getStoredAds();
        if (stored.length) {
            const response = {
                data: stored.map((a) => {
                    const { _raw, ...rest } = a;
                    return rest;
                }),
                total_count: stored.length,
                source: 'in_memory_store',
                last_synced: new Date().toISOString(),
            };
            return res.json(response);
        }
        let parsed;
        try {
            parsed = JSON.parse(raw);
        }
        catch {
            return res.status(500).json({ error: 'Invalid JSON in sample_ads.json' });
        }
        const rawAds = Array.isArray(parsed)
            ? parsed
            : isRecord(parsed) && Array.isArray(parsed.data)
                ? parsed.data
                : [];
        if (!rawAds.length) {
            return res.status(500).json({
                error: 'Unexpected JSON shape in sample_ads.json (expected an array, or an object with a data array)',
            });
        }
        const normalized = parseMetaAdsJson(rawAds);
        setAds(normalized);
        const response = {
            data: normalized.map((a) => {
                const { _raw, ...rest } = a;
                return rest;
            }),
            total_count: normalized.length,
            source: 'meta_ad_library',
            last_synced: stats.mtime.toISOString(),
        };
        return res.json(response);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return res.status(500).json({ error: 'Failed to load meta ads', details: message });
    }
});
app.get('/api/health', (_req, res) => res.json({ ok: true }));
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Ad Intel API running at http://localhost:${PORT}`);
});
