import express, { Express } from 'express';
import { ENV } from './utils/env.js';
import authRoutes from './routes/auth.routes.js';
import clientsRoutes from './routes/clients.routes.js';
import productsRoutes from './routes/products.routes.js';
import excelRoutes from './routes/excel.routes.js';
import imagesRoutes from './routes/images.routes.js';

const allowedOrigins = ENV.CORS_ORIGIN.split(',')
  .map((origin) => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean);

export function createApp() {
  const app = express();

  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
    }
    res.header('Vary', 'Origin');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Expose-Headers', 'Content-Disposition');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/clients', clientsRoutes);
  app.use('/api/clients', productsRoutes);
  app.use('/api/clients', excelRoutes);
  app.use('/api/images', imagesRoutes);

  // 404
  app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
  });

  return app;
}
