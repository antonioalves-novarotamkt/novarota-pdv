import { prisma } from '../db/prisma.js';
import { verifyPassword } from '../utils/password.js';
import { generateTokens } from '../utils/jwt.js';

export interface LoginInput {
  email: string;
  password: string;
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findFirst({
    where: { email: { equals: input.email.trim(), mode: 'insensitive' } },
  });

  if (!user) {
    throw new Error('Email ou senha inválidos');
  }

  const passwordMatch = await verifyPassword(input.password, user.password);
  if (!passwordMatch) {
    throw new Error('Email ou senha inválidos');
  }

  const tokens = generateTokens({
    userId: user.id,
    email: user.email,
  });

  return { user: { id: user.id, email: user.email, name: user.name }, ...tokens };
}
