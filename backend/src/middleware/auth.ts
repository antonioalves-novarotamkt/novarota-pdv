import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';
import { prisma } from '../db/prisma.js';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
    }
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  let payload;
  try {
    payload = verifyToken(authHeader.slice(7));
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // A valid token can point to a user that no longer exists (e.g. after switching databases).
  // Returning 401 makes the frontend send the user back to the login screen.
  let user;
  try {
    user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { id: true } });
  } catch (error) {
    console.error('Auth user lookup failed:', error);
    return res.status(500).json({ error: 'Erro ao validar a sessão. Tente novamente.' });
  }
  if (!user) {
    return res.status(401).json({ error: 'Sessão expirada. Entre novamente.' });
  }

  req.userId = payload.userId;
  req.userEmail = payload.email;
  next();
}
