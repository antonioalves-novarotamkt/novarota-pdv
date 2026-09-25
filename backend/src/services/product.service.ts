import { randomUUID } from 'crypto';
import { prisma } from '../db/prisma.js';
import { calculateFinalPrice } from '../utils/pricing.js';

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

// Never select ProductImage.data here: it holds the image bytes.
const productInclude = {
  category: true,
  images: { select: { id: true, url: true, order: true }, orderBy: { order: 'asc' as const } },
  channelPrices: true,
};

export async function createProduct(clientId: string, input: CreateProductInput) {
  let markup = input.markup;
  if (markup === undefined) {
    const client = await prisma.client.findUniqueOrThrow({ where: { id: clientId } });
    markup = client.defaultMarkup;
  }
  const finalPrice = calculateFinalPrice(input.basePrice, markup);

  if (input.sku) {
    const existing = await prisma.product.findUnique({
      where: { clientId_sku: { clientId, sku: input.sku } },
    });
    if (existing) {
      throw new Error('Já existe um produto com este código neste cliente');
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
    include: productInclude,
  });
}

export async function getProducts(clientId: string, categoryId?: string) {
  return prisma.product.findMany({
    where: {
      clientId,
      categoryId: categoryId || undefined,
    },
    include: productInclude,
    orderBy: { createdAt: 'desc' },
  });
}

export async function getProductById(productId: string, clientId: string) {
  return prisma.product.findFirst({
    where: { id: productId, clientId },
    include: productInclude,
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
    include: productInclude,
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

export async function applyMarkupToAll(clientId: string, markup: number) {
  return prisma.$transaction(async (tx) => {
    await tx.client.update({ where: { id: clientId }, data: { defaultMarkup: markup } });
    // Same rounding as calculateFinalPrice (2 decimal places), done in SQL to update all rows at once.
    const updated = await tx.$executeRaw`
      UPDATE "products"
      SET "markup" = ${markup},
          "finalPrice" = ROUND(("basePrice" * (1 + ${markup}::double precision / 100))::numeric, 2)::double precision,
          "updatedAt" = NOW()
      WHERE "clientId" = ${clientId}
    `;
    return { updated };
  });
}

export async function setProductImage(
  productId: string,
  clientId: string,
  image: { data: Buffer; mimeType: string }
) {
  const product = await getProductById(productId, clientId);
  if (!product) {
    throw new Error('Product not found');
  }

  const id = randomUUID();
  await prisma.$transaction([
    prisma.productImage.deleteMany({ where: { productId } }),
    prisma.productImage.create({
      data: {
        id,
        url: `/api/images/${id}`,
        data: image.data,
        mimeType: image.mimeType,
        productId,
        clientId,
      },
    }),
  ]);

  return getProductById(productId, clientId);
}

export async function removeProductImage(productId: string, clientId: string) {
  const product = await getProductById(productId, clientId);
  if (!product) {
    throw new Error('Product not found');
  }
  await prisma.productImage.deleteMany({ where: { productId } });
  return getProductById(productId, clientId);
}

export async function getImage(imageId: string) {
  return prisma.productImage.findUnique({
    where: { id: imageId },
    select: { data: true, mimeType: true },
  });
}
