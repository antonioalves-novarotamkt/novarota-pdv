import express, { Express } from 'express';
import { ENV } from './utils/env.js';
import authRoutes from './routes/auth.routes.js';
import clientsRoutes from './routes/clients.routes.js';
import productsRoutes from './routes/products.routes.js';

export function createApp() {
  const app = express();

  // CORS Middleware
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', ENV.CORS_ORIGIN);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
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

  // 404
  app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
  });

  return app;
}
