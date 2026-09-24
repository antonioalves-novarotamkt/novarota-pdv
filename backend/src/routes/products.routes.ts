import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { clientAccessMiddleware } from '../middleware/clientAccess';
import * as productService from '../services/product.service';

const router = Router();

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
      const { name, description, sku, basePrice, markup, categoryId, active } = req.body;

      if (!name || basePrice === undefined) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const product = await productService.createProduct(req.params.clientId, {
        name,
        description,
        sku,
        basePrice: parseFloat(basePrice),
        markup: markup ? parseFloat(markup) : undefined,
        categoryId,
        active,
      });

      res.status(201).json({ data: product });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
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
      const product = await productService.updateProduct(
        req.params.productId,
        req.params.clientId,
        {
          name: req.body.name,
          description: req.body.description,
          sku: req.body.sku,
          basePrice: req.body.basePrice ? parseFloat(req.body.basePrice) : undefined,
          markup: req.body.markup ? parseFloat(req.body.markup) : undefined,
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
