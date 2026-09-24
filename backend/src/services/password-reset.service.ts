import { createHash, randomBytes } from 'crypto';
import { prisma } from '../db/prisma.js';
import { hashPassword } from '../utils/password.js';
import { sendPasswordResetEmail } from '../utils/mailer.js';
import { ENV } from '../utils/env.js';

const TOKEN_TTL_MS = 60 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
export const MIN_PASSWORD_LENGTH = 6;

export class PasswordResetError extends Error {}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findFirst({
    where: { email: { equals: email.trim(), mode: 'insensitive' } },
  });
  if (!user) return;

  const recent = await prisma.passwordResetToken.findFirst({
    where: { userId: user.id, createdAt: { gt: new Date(Date.now() - RESEND_COOLDOWN_MS) } },
  });
  if (recent) return;

  const token = randomBytes(32).toString('hex');
  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
    prisma.passwordResetToken.create({
      data: {
        tokenHash: hashToken(token),
        userId: user.id,
        expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
      },
    }),
  ]);

  const resetUrl = `${ENV.APP_URL.replace(/\/+$/, '')}/redefinir-senha/${token}`;
  // Not awaited: the response time must not reveal whether the email exists.
  sendPasswordResetEmail(user.email, user.name, resetUrl).catch((error) => {
    console.error('Failed to send password reset email:', error);
  });
}

export async function resetPassword(token: string, password: string) {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new PasswordResetError(`A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`);
  }

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });
  if (!record || record.expiresAt < new Date()) {
    throw new PasswordResetError('Este link é inválido ou já expirou. Peça um novo na tela de login.');
  }

  const passwordHash = await hashPassword(password);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { password: passwordHash } }),
    prisma.passwordResetToken.deleteMany({ where: { userId: record.userId } }),
  ]);
}
