import { prisma } from './prisma';
import { hashPassword } from '../utils/password';

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo user
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      password: await hashPassword('demo123'),
      name: 'Demo User',
    },
  });

  console.log(`✓ Created user: ${demoUser.email}`);

  // Create demo client
  const demoClient = await prisma.client.upsert({
    where: { slug: 'pizzaria-demo' },
    update: {},
    create: {
      name: 'Pizzaria Demo',
      slug: 'pizzaria-demo',
      email: 'pizzaria@example.com',
      phone: '(11) 9999-9999',
      userId: demoUser.id,
    },
  });

  console.log(`✓ Created client: ${demoClient.name}`);

  // Create demo categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { clientId_name: { clientId: demoClient.id, name: 'Pizzas' } },
      update: {},
      create: {
        name: 'Pizzas',
        icon: '🍕',
        order: 1,
        clientId: demoClient.id,
      },
    }),
    prisma.category.upsert({
      where: { clientId_name: { clientId: demoClient.id, name: 'Bebidas' } },
      update: {},
      create: {
        name: 'Bebidas',
        icon: '🥤',
        order: 2,
        clientId: demoClient.id,
      },
    }),
  ]);

  console.log(`✓ Created ${categories.length} categories`);

  // Create demo products
  const products = await Promise.all([
    prisma.product.upsert({
      where: { sku: 'PIZZA001' },
      update: {},
      create: {
        name: 'Pizza Margherita',
        description: 'Pizza clássica com tomate, muçarela e manjericão',
        sku: 'PIZZA001',
        basePrice: 25.0,
        markup: 50,
        finalPrice: 37.5,
        categoryId: categories[0].id,
        clientId: demoClient.id,
      },
    }),
    prisma.product.upsert({
      where: { sku: 'PIZZA002' },
      update: {},
      create: {
        name: 'Pizza Pepperoni',
        description: 'Pizza com molho de tomate, queijo e pepperoni',
        sku: 'PIZZA002',
        basePrice: 30.0,
        markup: 50,
        finalPrice: 45.0,
        categoryId: categories[0].id,
        clientId: demoClient.id,
      },
    }),
    prisma.product.upsert({
      where: { sku: 'BEB001' },
      update: {},
      create: {
        name: 'Refrigerante 2L',
        description: 'Refrigerante gelado',
        sku: 'BEB001',
        basePrice: 8.0,
        markup: 40,
        finalPrice: 11.2,
        categoryId: categories[1].id,
        clientId: demoClient.id,
      },
    }),
  ]);

  console.log(`✓ Created ${products.length} products`);

  // Create demo sales channels
  const channels = await Promise.all([
    prisma.salesChannel.upsert({
      where: { clientId_name: { clientId: demoClient.id, name: 'Loja Física' } },
      update: {},
      create: {
        name: 'Loja Física',
        icon: '🏪',
        order: 1,
        clientId: demoClient.id,
      },
    }),
    prisma.salesChannel.upsert({
      where: { clientId_name: { clientId: demoClient.id, name: 'iFood' } },
      update: {},
      create: {
        name: 'iFood',
        icon: '📱',
        order: 2,
        clientId: demoClient.id,
      },
    }),
  ]);

  console.log(`✓ Created ${channels.length} sales channels`);

  console.log('✅ Seed completed!');
  console.log('\n📝 Demo credentials:');
  console.log('   Email: demo@example.com');
  console.log('   Password: demo123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
