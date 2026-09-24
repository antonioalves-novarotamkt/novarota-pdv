import { prisma } from '../db/prisma.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { generateTokens } from '../utils/jwt.js';

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export async function registerUser(input: RegisterInput) {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existingUser) {
    throw new Error('Este email já está cadastrado');
  }

  const hashedPassword = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      password: hashedPassword,
      name: input.name,
    },
  });

  const tokens = generateTokens({
    userId: user.id,
    email: user.email,
  });

  return { user: { id: user.id, email: user.email, name: user.name }, ...tokens };
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
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
