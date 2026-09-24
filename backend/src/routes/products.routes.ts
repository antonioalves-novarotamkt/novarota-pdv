import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth.js';
import { clientAccessMiddleware } from '../middleware/clientAccess.js';
import * as productService from '../services/product.service.js';

const router = Router();

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
});

function uploadImage(req: Request, res: Response, next: NextFunction) {
  imageUpload.single('image')(req, res, (err: unknown) => {
    if (!err) return next();
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'A foto é maior que 3 MB.' });
    }
    return res.status(400).json({ error: 'Não foi possível receber a foto.' });
  });
}

// Treats undefined/null/'' as "not sent" (so 0 is a valid value); NaN means invalid.
function optionalNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  return Number(value);
}

function invalidAmount(value: number | undefined) {
  return value !== undefined && (!Number.isFinite(value) || value < 0);
}

// Get products for a client
router.get(
  '/:clientId/products',
  authMiddleware,
  clientAccessMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { categoryId } = req.query;
      const products = await productService.getProducts(
        req.params.clientId,
        categoryId as string
      );
      res.json({ data: products });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Create product
router.post(
  '/:clientId/products',
  authMiddleware,
  clientAccessMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { name, description, sku, categoryId, active } = req.body;
      const basePrice = optionalNumber(req.body.basePrice);
      const markup = optionalNumber(req.body.markup);

      if (!name || basePrice === undefined) {
        return res.status(400).json({ error: 'Informe o nome e o preço na loja.' });
      }
      if (invalidAmount(basePrice) || invalidAmount(markup)) {
        return res.status(400).json({ error: 'Preço e acréscimo precisam ser números positivos.' });
      }

      const product = await productService.createProduct(req.params.clientId, {
        name,
        description,
        sku,
        basePrice,
        markup,
        categoryId,
        active,
      });

      res.status(201).json({ data: product });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

// Apply one markup (%) to every product of the client and make it the default for new ones
router.patch(
  '/:clientId/markup',
  authMiddleware,
  clientAccessMiddleware,
  async (req: Request, res: Response) => {
    const markup = optionalNumber(req.body.markup);
    if (markup === undefined || invalidAmount(markup)) {
      return res.status(400).json({ error: 'Informe um acréscimo válido (0 ou mais).' });
    }
    try {
      const result = await productService.applyMarkupToAll(req.params.clientId, markup);
      res.json({ data: { markup, ...result } });
    } catch (error) {
      console.error('Apply markup failed:', error);
      res.status(500).json({ error: 'Não foi possível aplicar o acréscimo.' });
    }
  }
);

// Get product by ID
router.get(
  '/:clientId/products/:productId',
  authMiddleware,
  clientAccessMiddleware,
  async (req: Request, res: Response) => {
    try {
      const product = await productService.getProductById(
        req.params.productId,
        req.params.clientId
      );

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      res.json({ data: product });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Update product
router.patch(
  '/:clientId/products/:productId',
  authMiddleware,
  clientAccessMiddleware,
  async (req: Request, res: Response) => {
    try {
      const basePrice = optionalNumber(req.body.basePrice);
      const markup = optionalNumber(req.body.markup);
      if (invalidAmount(basePrice) || invalidAmount(markup)) {
        return res.status(400).json({ error: 'Preço e acréscimo precisam ser números positivos.' });
      }

      const product = await productService.updateProduct(
        req.params.productId,
        req.params.clientId,
        {
          name: req.body.name,
          description: req.body.description,
          sku: req.body.sku,
          basePrice,
          markup,
          categoryId: req.body.categoryId,
          active: req.body.active,
        }
      );

      res.json({ data: product });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

// Set (or replace) the product photo
router.put(
  '/:clientId/products/:productId/image',
  authMiddleware,
  clientAccessMiddleware,
  uploadImage,
  async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma foto enviada.' });
    }
    if (!IMAGE_TYPES.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'Envie uma foto em JPG, PNG ou WebP.' });
    }
    try {
      const product = await productService.setProductImage(req.params.productId, req.params.clientId, {
        data: req.file.buffer,
        mimeType: req.file.mimetype,
      });
      res.json({ data: product });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

// Remove the product photo
router.delete(
  '/:clientId/products/:productId/image',
  authMiddleware,
  clientAccessMiddleware,
  async (req: Request, res: Response) => {
    try {
      const product = await productService.removeProductImage(req.params.productId, req.params.clientId);
      res.json({ data: product });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

// Delete product
router.delete(
  '/:clientId/products/:productId',
  authMiddleware,
  clientAccessMiddleware,
  async (req: Request, res: Response) => {
    try {
      await productService.deleteProduct(req.params.productId, req.params.clientId);
      res.json({ message: 'Product deleted' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

export default router;
