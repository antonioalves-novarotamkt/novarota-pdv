import { prisma } from '../db/prisma.js';

export interface CreateClientInput {
  name: string;
  slug: string;
  email: string;
  phone?: string;
}

// "Comida Brasileira!" -> "comida-brasileira". The slug is used in URLs and export file names.
export function toSlug(text: string) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function createClient(userId: string, input: CreateClientInput) {
  const slug = toSlug(input.slug || input.name);
  if (!slug) {
    throw new Error('Informe um identificador com letras ou números.');
  }

  const existing = await prisma.client.findUnique({
    where: { slug },
  });

  if (existing) {
    throw new Error('Já existe um cliente com este identificador. Use outro.');
  }

  const client = await prisma.client.create({
    data: {
      name: input.name,
      slug,
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
    include: { _count: { select: { products: true } } },
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
