const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const pw = await bcrypt.hash('123456', 10);
  await prisma.user.upsert({
    where: { email: 'admin.bi@trackgo.com' },
    update: { password: pw, role: 'ADMIN', name: 'Admin BI' },
    create: { email: 'admin.bi@trackgo.com', password: pw, role: 'ADMIN', name: 'Admin BI' }
  });
  console.log('Admin user created/updated successfully');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
