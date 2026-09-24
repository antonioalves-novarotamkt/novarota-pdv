import { prisma } from '../db/prisma';
import { hashPassword, verifyPassword } from '../utils/password';
import { generateTokens } from '../utils/jwt';

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
    throw new Error('Email already in use');
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
    throw new Error('User not found');
  }

  const passwordMatch = await verifyPassword(input.password, user.password);
  if (!passwordMatch) {
    throw new Error('Invalid password');
  }

  const tokens = generateTokens({
    userId: user.id,
    email: user.email,
  });

  return { user: { id: user.id, email: user.email, name: user.name }, ...tokens };
}
