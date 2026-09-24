import { prisma } from '../db/prisma';

export interface CreateClientInput {
  name: string;
  slug: string;
  email: string;
  phone?: string;
}

export async function createClient(userId: string, input: CreateClientInput) {
  const existing = await prisma.client.findUnique({
    where: { slug: input.slug },
  });

  if (existing) {
    throw new Error('Slug already exists');
  }

  const client = await prisma.client.create({
    data: {
      name: input.name,
      slug: input.slug,
      email: input.email,
      phone: input.phone,
      userId,
    },
  });

  return client;
}

export async function getClientsByUser(userId: string) {
  return prisma.client.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getClientById(clientId: string, userId: string) {
  return prisma.client.findFirst({
    where: { id: clientId, userId },
    include: {
      products: { take: 5, orderBy: { createdAt: 'desc' } },
      categories: { orderBy: { order: 'asc' } },
      salesChannels: { orderBy: { order: 'asc' } },
    },
  });
}

export async function updateClient(clientId: string, userId: string, data: Partial<CreateClientInput>) {
  const client = await prisma.client.findFirst({
    where: { id: clientId, userId },
  });

  if (!client) {
    throw new Error('Client not found or access denied');
  }

  return prisma.client.update({
    where: { id: clientId },
    data,
  });
}

export async function deleteClient(clientId: string, userId: string) {
  const client = await prisma.client.findFirst({
    where: { id: clientId, userId },
  });

  if (!client) {
    throw new Error('Client not found or access denied');
  }

  return prisma.client.delete({
    where: { id: clientId },
  });
}
