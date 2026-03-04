import { Router } from 'express';
import multer from 'multer';
import { parseCSVBuffer } from '../utils/csvParser.js';
import { setAds } from '../store.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const router = Router();

router.post('/', upload.single('file'), (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: 'No file uploaded. Use field name "file".' });
  }
  try {
    const ads = parseCSVBuffer(file.buffer);
    setAds(ads);
    return res.json({
      ok: true,
      totalRows: ads.length,
      brands: [...new Set(ads.map((a) => a.brandName))],
    });
  } catch (e) {
    console.error(e);
    return res.status(422).json({ error: 'Invalid CSV', details: String(e) });
  }
});

export default router;
