/* eslint-disable no-console */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding roles...');
  const roleNames = ['Admin', 'Security Officer', 'Employee', 'Visitor'];
  const roles = {};
  for (const name of roleNames) {
    roles[name] = await prisma.role.upsert({
      where: { roleName: name },
      update: {},
      create: { roleName: name, description: `${name} role` },
    });
  }

  console.log('Seeding default department...');
  const department = await prisma.department.upsert({
    where: { departmentName: 'General Administration' },
    update: {},
    create: {
      departmentName: 'General Administration',
      description: 'Default department created by the seed script',
      location: 'Main Building, Ground Floor',
    },
  });

  console.log('Seeding admin user...');
  const adminPasswordHash = await bcrypt.hash('Admin@12345', 12);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      email: 'admin@example.com',
      passwordHash: adminPasswordHash,
      fullName: 'System Administrator',
      roleId: roles['Admin'].roleId,
      isActive: true,
    },
    create: {
      username: 'admin',
      email: 'admin@example.com',
      passwordHash: adminPasswordHash,
      fullName: 'System Administrator',
      roleId: roles['Admin'].roleId,
      isActive: true,
    },
  });

  console.log('Seeding security officer user...');
  const securityPasswordHash = await bcrypt.hash('Security@12345', 12);
  await prisma.user.upsert({
    where: { username: 'security1' },
    update: {
      email: 'security@example.com',
      passwordHash: securityPasswordHash,
      fullName: 'Front Desk Security',
      roleId: roles['Security Officer'].roleId,
      isActive: true,
    },
    create: {
      username: 'security1',
      email: 'security@example.com',
      passwordHash: securityPasswordHash,
      fullName: 'Front Desk Security',
      roleId: roles['Security Officer'].roleId,
      isActive: true,
    },
  });

  console.log('Seeding a sample employee (host) with login...');
  const employeePasswordHash = await bcrypt.hash('Employee@12345', 12);
  const employeeUser = await prisma.user.upsert({
    where: { username: 'jsmith' },
    update: {
      email: 'employee@example.com',
      passwordHash: employeePasswordHash,
      fullName: 'Jane Smith',
      roleId: roles['Employee'].roleId,
      isActive: true,
    },
    create: {
      username: 'jsmith',
      email: 'employee@example.com',
      passwordHash: employeePasswordHash,
      fullName: 'Jane Smith',
      roleId: roles['Employee'].roleId,
      isActive: true,
    },
  });

  await prisma.employee.upsert({
    where: { employeeCode: '0001' },
    update: {
      email: 'employee@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
    },
    create: {
      employeeCode: '0001',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'employee@example.com',
      designation: 'Operations Manager',
      departmentId: department.departmentId,
      userId: employeeUser.userId,
    },
  });

  console.log('\nSeed complete. Default credentials:');
  console.log('  Admin            -> username: admin      | password: Admin@12345');
  console.log('  Security Officer -> username: security1  | password: Security@12345');
  console.log('  Employee         -> username: jsmith      | password: Employee@12345');
  console.log('\n IMPORTANT: change these passwords immediately in any non-local environment.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
