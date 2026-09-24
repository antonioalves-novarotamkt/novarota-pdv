import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/prisma.js';

export async function clientAccessMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { clientId } = req.params;
  const userId = req.userId;

  if (!userId || !clientId) {
    return res.status(400).json({ error: 'Missing clientId or userId' });
  }

  try {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client || client.userId !== userId) {
      return res.status(403).json({ error: 'Access denied to this client' });
    }

    next();
  } catch (error) {
    return res.status(500).json({ error: 'Failed to verify client access' });
  }
}
