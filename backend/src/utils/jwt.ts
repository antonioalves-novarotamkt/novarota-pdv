import jwt from 'jsonwebtoken';
import { ENV } from './env';

export interface JwtPayload {
  userId: string;
  email: string;
}

export function generateTokens(payload: JwtPayload) {
  const accessToken = jwt.sign(payload, ENV.JWT_SECRET, {
    expiresIn: '7d',
  });

  const refreshToken = jwt.sign(payload, ENV.JWT_SECRET, {
    expiresIn: '30d',
  });

  return { accessToken, refreshToken };
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, ENV.JWT_SECRET) as JwtPayload;
}
