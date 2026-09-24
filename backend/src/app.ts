import express from 'express';
import cors from 'cors';

export function createApp() {
  const app = express();

  // Middleware
  app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173'
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // API routes (será implementado)
  app.use('/api', (req, res) => {
    res.json({ message: 'API v1.0.0 - Menu Manager' });
  });

  // 404
  app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
  });

  return app;
}
