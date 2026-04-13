import { PrismaClient, Role, PackageStatus, RouteStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // 1. Limpa o banco atual (cuidado em produção)
  await prisma.package.deleteMany();
  await prisma.route.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.user.deleteMany();

  // 2. Cria usuário Admin Padrão
  const adminPassword = await bcrypt.hash('123456', 10);
  const admin = await prisma.user.create({
    data: {
      name: 'Admin TrackGo',
      email: 'admin@trackgo.com',
      password: adminPassword,
      role: Role.ADMIN,
    },
  });
  console.log(`✅ Admin criado: ${admin.email}`);

  // 3. Cria usuário Motorista
  const driverPassword = await bcrypt.hash('123456', 10);
  const driverUser = await prisma.user.create({
    data: {
      name: 'João Motorista',
      email: 'joao@trackgo.com',
      password: driverPassword,
      role: Role.DRIVER,
    },
  });

  const driverProfile = await prisma.driver.create({
    data: {
      licenseNumber: '12345678900',
      phone: '11999999999',
      userId: driverUser.id,
    },
  });
  console.log(`✅ Motorista criado: ${driverUser.email}`);

  // 4. Criação de Rota Rascunho
  const routeDraft = await prisma.route.create({
    data: {
      name: 'Zona Sul - Preliminar',
      date: new Date(),
      status: RouteStatus.DRAFT,
      createdById: admin.id,
    },
  });

  // 5. Criação de Pacotes
  await prisma.package.createMany({
    data: [
      {
        trackingCode: 'TRKG001',
        recipientName: 'Maria Silva',
        address: 'Rua Domingos, 123, SP',
        latitude: -23.550520,
        longitude: -46.633308,
        status: PackageStatus.PENDING,
        routeId: routeDraft.id,
      },
      {
        trackingCode: 'TRKG002',
        recipientName: 'Carlos Souza',
        address: 'Av Paulista, 1000, SP',
        latitude: -23.561684,
        longitude: -46.655981,
        status: PackageStatus.PENDING,
        routeId: routeDraft.id,
      },
    ],
  });

  console.log(`✅ Rota '${routeDraft.name}' criada com pacotes pendentes.`);
  console.log('🌲 Seed finalizado com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
