import { Router, Request, Response } from 'express';
import { getImage } from '../services/product.service.js';

const router = Router();

// Public on purpose: <img> tags can't send the auth header, and menu photos aren't secret.
// Image ids are random UUIDs, and a new id is created whenever a photo is replaced.
router.get('/:imageId', async (req: Request, res: Response) => {
  try {
    const image = await getImage(req.params.imageId);
    if (!image?.data || !image.mimeType) {
      return res.status(404).json({ error: 'Imagem não encontrada' });
    }
    res.setHeader('Content-Type', image.mimeType);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(Buffer.from(image.data));
  } catch (error) {
    console.error('Image load failed:', error);
    res.status(500).json({ error: 'Não foi possível carregar a imagem' });
  }
});

export default router;
