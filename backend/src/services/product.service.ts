import { prisma } from '../db/prisma';
import { calculateFinalPrice } from '../utils/pricing';

export interface CreateProductInput {
  name: string;
  description?: string;
  sku?: string;
  basePrice: number;
  markup?: number;
  categoryId?: string;
  active?: boolean;
}

export interface UpdateProductInput extends Partial<CreateProductInput> {}

export async function createProduct(clientId: string, input: CreateProductInput) {
  const markup = input.markup ?? 30;
  const finalPrice = calculateFinalPrice(input.basePrice, markup);

  if (input.sku) {
    const existing = await prisma.product.findUnique({
      where: { sku: input.sku },
    });
    if (existing) {
      throw new Error('SKU already exists');
    }
  }

  return prisma.product.create({
    data: {
      name: input.name,
      description: input.description,
      sku: input.sku,
      basePrice: input.basePrice,
      markup,
      finalPrice,
      categoryId: input.categoryId,
      active: input.active ?? true,
      clientId,
    },
    include: {
      category: true,
      images: { orderBy: { order: 'asc' } },
      channelPrices: true,
    },
  });
}

export async function getProducts(clientId: string, categoryId?: string) {
  return prisma.product.findMany({
    where: {
      clientId,
      categoryId: categoryId || undefined,
    },
    include: {
      category: true,
      images: { orderBy: { order: 'asc' } },
      channelPrices: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getProductById(productId: string, clientId: string) {
  return prisma.product.findFirst({
    where: { id: productId, clientId },
    include: {
      category: true,
      images: { orderBy: { order: 'asc' } },
      channelPrices: true,
    },
  });
}

export async function updateProduct(
  productId: string,
  clientId: string,
  input: UpdateProductInput
) {
  const product = await getProductById(productId, clientId);
  if (!product) {
    throw new Error('Product not found');
  }

  const markup = input.markup ?? product.markup;
  const basePrice = input.basePrice ?? product.basePrice;
  const finalPrice = calculateFinalPrice(basePrice, markup);

  return prisma.product.update({
    where: { id: productId },
    data: {
      name: input.name,
      description: input.description,
      basePrice,
      markup,
      finalPrice,
      categoryId: input.categoryId,
      active: input.active,
    },
    include: {
      category: true,
      images: { orderBy: { order: 'asc' } },
      channelPrices: true,
    },
  });
}

export async function deleteProduct(productId: string, clientId: string) {
  const product = await getProductById(productId, clientId);
  if (!product) {
    throw new Error('Product not found');
  }

  return prisma.product.delete({
    where: { id: productId },
  });
}
