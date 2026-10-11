require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function verify() {
  console.log('--- PASSWORD VERIFICATION SCRIPT ---');

  const admin = await prisma.user.findUnique({ where: { username: 'admin' }, include: { role: true } });
  const security = await prisma.user.findUnique({ where: { username: 'security1' }, include: { role: true } });
  const employee = await prisma.user.findUnique({ where: { username: 'jsmith' }, include: { role: true } });

  if (!admin || !security || !employee) {
    console.error('One or more required users not found in the database!');
    process.exit(1);
  }

  const adminValid = await bcrypt.compare('Admin@12345', admin.passwordHash);
  const securityValid = await bcrypt.compare('Security@12345', security.passwordHash);
  const employeeValid = await bcrypt.compare('Employee@12345', employee.passwordHash);

  console.log('bcrypt.compare("Admin@12345", admin.passwordHash)     ->', adminValid);
  console.log('bcrypt.compare("Security@12345", security.passwordHash) ->', securityValid);
  console.log('bcrypt.compare("Employee@12345", employee.passwordHash) ->', employeeValid);

  if (adminValid && securityValid && employeeValid) {
    console.log('\nSUCCESS: All default user passwords are verified true!');
  } else {
    console.error('\nFAILURE: One or more password hashes failed verification.');
    process.exit(1);
  }
}

verify()
  .catch((err) => {
    console.error('Verification error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
