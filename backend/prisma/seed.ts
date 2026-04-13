import { PrismaClient, Role, PackageStatus, RouteStatus, OccurrenceSeverity } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Funções auxiliares para geração de dados
function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat(min: number, max: number) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

function getRandomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

async function main() {
  console.log('🌱 Iniciando seed focado em métricas de BI e análise de dados (TrackGo)...');

  // 1. Limpeza de dados
  await prisma.auditLog.deleteMany();
  await prisma.occurrence.deleteMany();
  await prisma.deliveryProof.deleteMany();
  await prisma.tracking.deleteMany();
  await prisma.package.deleteMany();
  await prisma.route.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('123456', 10);
  const now = new Date();
  const thirtyDaysAgo = addDays(now, -30);

  // 2. Administrador
  const admin = await prisma.user.create({
    data: {
      name: 'Admin Sistema BI',
      email: 'admin.bi@trackgo.com',
      password: passwordHash,
      role: Role.ADMIN,
      createdAt: thirtyDaysAgo,
    },
  });

  // 3. Clientes (Mínimo 10)
  console.log('📦 Gerando Clientes...');
  const clientsBase = [
    { name: 'Logística Paraná LTDA', doc: '11122233344', phone: '(44) 99991-1111' },
    { name: 'Comércio Varejista Oeste', doc: '22233344455', phone: '(45) 99992-2222' },
    { name: 'Distribuidora Maringá', doc: '33344455566', phone: '(44) 99993-3333' },
    { name: 'Norte Sul Transportes', doc: '44455566677', phone: '(43) 99994-4444' },
    { name: 'Agropecuária Campo Mourão', doc: '55566677788', phone: '(44) 99995-5555' },
    { name: 'Móveis Cascavel S/A', doc: '66677788899', phone: '(45) 99996-6666' },
    { name: 'Eletrônicos Londrina', doc: '77788899900', phone: '(43) 99997-7777' },
    { name: 'Peças Automotivas PR', doc: '88899900011', phone: '(41) 99998-8888' },
    { name: 'Papelaria Curitiba', doc: '99900011122', phone: '(41) 99999-9999' },
    { name: 'Supermercado Central', doc: '00011122233', phone: '(44) 99990-0000' }
  ];

  const createdClients = [];
  for (const c of clientsBase) {
    const clientCreatedAt = getRandomDate(thirtyDaysAgo, addDays(thirtyDaysAgo, 10));
    const user = await prisma.user.create({
      data: { 
        name: c.name, 
        email: `contato@${c.name.replace(/[^a-zA-Z]/g, '').toLowerCase()}.com`, 
        password: passwordHash, 
        role: Role.CLIENT,
        createdAt: clientCreatedAt
      },
    });
    const client = await prisma.client.create({
      data: { document: c.doc, phone: c.phone, userId: user.id, createdAt: clientCreatedAt },
    });
    createdClients.push(client);
  }

  // 4. Veículos (Motos, Vans, Caminhões Leves)
  console.log('🚚 Gerando Veículos...');
  const vehiclesBase = [
    { plate: 'MOT-1001', model: 'Honda CG 160 Cargo', capacity: 30 }, // Moto
    { plate: 'MOT-2002', model: 'Yamaha Factor 150', capacity: 25 }, // Moto
    { plate: 'VAN-3003', model: 'Renault Master', capacity: 1500 }, // Van
    { plate: 'VAN-4004', model: 'Fiat Fiorino', capacity: 650 }, // Van pequena
    { plate: 'CAM-5005', model: 'Volkswagen Delivery 9.170', capacity: 5500 } // Caminhão Leve
  ];

  const createdVehicles = [];
  for (const v of vehiclesBase) {
    createdVehicles.push(await prisma.vehicle.create({
      data: { plate: v.plate, model: v.model, capacityKg: v.capacity }
    }));
  }

  // 5. Motoristas
  console.log('👨‍✈️ Gerando Motoristas...');
  const driversBase = [
    { name: 'Carlos Roberto', doc: '12345678901' },
    { name: 'João Miguel', doc: '23456789012' },
    { name: 'Pedro Henrique', doc: '34567890123' },
    { name: 'Lucas Silva', doc: '45678901234' },
    { name: 'Marcos Almeida', doc: '56789012345' }
  ];

  const createdDrivers = [];
  for (let i = 0; i < driversBase.length; i++) {
    const driverCreatedAt = getRandomDate(thirtyDaysAgo, addDays(thirtyDaysAgo, 5));
    const user = await prisma.user.create({
      data: { 
        name: driversBase[i].name, 
        email: `motorista${i}@trackgo.com`, 
        password: passwordHash, 
        role: Role.DRIVER,
        createdAt: driverCreatedAt
      },
    });
    const driver = await prisma.driver.create({
      data: { 
        licenseNumber: driversBase[i].doc, 
        phone: '(44) 9' + getRandomInt(10000000, 99999999), 
        userId: user.id, 
        vehicleId: createdVehicles[i].id,
        createdAt: driverCreatedAt
      },
    });
    createdDrivers.push(driver);
  }

  // 6. Rotas com distâncias
  console.log('🗺️ Gerando Rotas e calculando distâncias aproximadas...');
  const routesBase = [
    { name: 'Maringá > Campo Mourão', distance: 93.5, timeH: 1.5, status: RouteStatus.COMPLETED,  address: 'Maringá, PR' },
    { name: 'Campo Mourão > Cascavel', distance: 198.2, timeH: 3.0, status: RouteStatus.IN_PROGRESS, address: 'Campo Mourão, PR' },
    { name: 'Londrina > Maringá', distance: 114.8, timeH: 1.8, status: RouteStatus.COMPLETED,  address: 'Londrina, PR' },
    { name: 'Cascavel > Toledo', distance: 48.0, timeH: 0.8, status: RouteStatus.OPTIMIZED,    address: 'Cascavel, PR' },
    { name: 'Curitiba > Ponta Grossa', distance: 115.0, timeH: 1.9, status: RouteStatus.DRAFT,        address: 'Curitiba, PR' },
    { name: 'Maringá > Umuarama', distance: 162.0, timeH: 2.5, status: RouteStatus.COMPLETED,  address: 'Maringá, PR' }
  ];

  const createdRoutes = [];
  for (let i = 0; i < routesBase.length; i++) {
    const routeDate = getRandomDate(thirtyDaysAgo, now);
    const route = await prisma.route.create({
      data: {
        name: routesBase[i].name,
        date: routeDate,
        status: routesBase[i].status,
        startAddress: routesBase[i].address,
        totalDistance: routesBase[i].distance,
        estimatedTime: routesBase[i].timeH,
        driverId: createdDrivers[i % createdDrivers.length].id, // Distribui entre os motoristas
        createdById: admin.id,
        createdAt: addDays(routeDate, -1)
      }
    });
    createdRoutes.push(route);
  }

  // 7. Pacotes (Distribuição temporal e de status variada)
  console.log('📦 Gerando 60 Pacotes...');
  const createdPackages = [];
  let trackingCounter = 1000;
  
  for (let i = 0; i < 60; i++) {
    // Escolher Rota e Cliente
    const route = createdRoutes[getRandomInt(0, createdRoutes.length - 1)];
    const client = createdClients[getRandomInt(0, createdClients.length - 1)];
    
    // Status do pacote dependente do status da rota para fazer sentido
    let status: PackageStatus = PackageStatus.PENDING;
    if (route.status === RouteStatus.COMPLETED) {
      // Rotas finalizadas podem ter pacotes ENTREGUES(70%), FAILED(20%) ou RETURNED(10%) -> Simulando "Atrasados" ou não entregues
      const r = Math.random();
      if (r < 0.7) status = PackageStatus.DELIVERED;
      else if (r < 0.9) status = PackageStatus.FAILED;
      else status = PackageStatus.RETURNED;
    } else if (route.status === RouteStatus.IN_PROGRESS) {
      status = PackageStatus.IN_ROUTE;
    } else {
      status = PackageStatus.PENDING;
    }

    // Datas baseadas na rota
    const pkgCreatedAt = addDays(route.date, -getRandomInt(1, 4));

    const pkg = await prisma.package.create({
      data: {
        trackingCode: `TRKG${trackingCounter++}`,
        recipientName: `Destinatário Fictício ${i}`,
        address: `Endereço Aleatório ${getRandomInt(10, 999)}, PR`,
        weight: getRandomFloat(0.5, 45.0), // 0.5kg a 45kg (Alguns pra moto, outros caminhão)
        status: status,
        clientId: client.id,
        routeId: route.id,
        createdAt: pkgCreatedAt,
        updatedAt: status === PackageStatus.PENDING ? pkgCreatedAt : addDays(pkgCreatedAt, 1)
      }
    });
    createdPackages.push(pkg);
  }

  // 8. Eventos de tracking e Ocorrências cronológicas (Simulando BI Timeline)
  console.log('📍 Gerando Tracking Events e Ocorrências...');
  const trackingData = [];
  const occurrencesData = [];

  for (const pkg of createdPackages) {
    const route = createdRoutes.find(r => r.id === pkg.routeId)!;
    
    // Todos recebem o evento PENDING quando o pacote é criado
    trackingData.push({
      packageId: pkg.id,
      status: PackageStatus.PENDING,
      location: 'Unidade de Triagem',
      latitude: -23.4210, // Lat Maringá aprox referencial
      longitude: -51.9331,
      timestamp: pkg.createdAt
    });

    if (pkg.status !== PackageStatus.PENDING) {
      // Evento de Saída (IN_ROUTE)
      const dispatchTime = addDays(pkg.createdAt, 1);
      trackingData.push({
        packageId: pkg.id,
        status: PackageStatus.IN_ROUTE,
        location: 'Em trânsito para destino',
        latitude: -23.7000 + getRandomFloat(-0.5, 0.5),
        longitude: -52.0000 + getRandomFloat(-0.5, 0.5),
        timestamp: dispatchTime
      });

      if (pkg.status === PackageStatus.DELIVERED) {
        // Entregue
        trackingData.push({
          packageId: pkg.id,
          status: PackageStatus.DELIVERED,
          location: pkg.address,
          latitude: -24.0000 + getRandomFloat(-1.0, 1.0),
          longitude: -52.5000 + getRandomFloat(-1.0, 1.0),
          timestamp: addDays(dispatchTime, getRandomFloat(0.5, 2))
        });
      }

      if (pkg.status === PackageStatus.FAILED) {
        // Falha = Atraso Severo
        const failTime = addDays(dispatchTime, getRandomFloat(0.5, 1));
        trackingData.push({
          packageId: pkg.id,
          status: PackageStatus.FAILED,
          location: 'Bloqueio na rodovia / Veículo Quebrado',
          latitude: -24.0000 + getRandomFloat(-1.0, 1.0),
          longitude: -52.5000 + getRandomFloat(-1.0, 1.0),
          timestamp: failTime
        });

        occurrencesData.push({
          title: 'Atraso Critico na Entrega',
          description: 'Veículo sofreu problemas mecânicos, refletindo em status de falha/atrasado',
          severity: OccurrenceSeverity.HIGH,
          packageId: pkg.id,
          routeId: route.id,
          reportedById: route.driverId ? (createdDrivers.find(d => d.id === route.driverId)?.userId ?? admin.id) : admin.id,
          createdAt: failTime
        });
      }
      
      if (pkg.status === PackageStatus.RETURNED) {
        // Endereço não encontrado
        const failTime = addDays(dispatchTime, getRandomFloat(0.5, 1));
        trackingData.push({
          packageId: pkg.id,
          status: PackageStatus.RETURNED,
          location: 'Endereço Destinatário',
          latitude: -24.0000 + getRandomFloat(-1.0, 1.0),
          longitude: -52.5000 + getRandomFloat(-1.0, 1.0),
          timestamp: failTime
        });

        occurrencesData.push({
          title: 'Cliente ausente / Endereço não encontrado',
          description: 'Tentativa de entrega falhou, pacote retornando à base',
          severity: OccurrenceSeverity.LOW,
          packageId: pkg.id,
          routeId: route.id,
          reportedById: route.driverId ? (createdDrivers.find(d => d.id === route.driverId)?.userId ?? admin.id) : admin.id,
          createdAt: failTime
        });
      }
    }
  }

  // Batch insert
  await prisma.tracking.createMany({ data: trackingData });
  if (occurrencesData.length > 0) {
    await prisma.occurrence.createMany({ data: occurrencesData });
  }

  console.log('✅ Base de dados re-populada com sucesso com regras de BI reais!');
  console.log(`📊 Totais inseridos:`);
  console.log(` - Administradores: 1`);
  console.log(` - Clientes: ${createdClients.length}`);
  console.log(` - Veículos: ${createdVehicles.length}`);
  console.log(` - Motoristas: ${createdDrivers.length}`);
  console.log(` - Rotas: ${createdRoutes.length}`);
  console.log(` - Pacotes: ${createdPackages.length}`);
  console.log(` - Eventos Tracking: ${trackingData.length}`);
  console.log(` - Ocorrências (Atrasos/Problemas): ${occurrencesData.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
