const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(typeof data === 'string' ? data : JSON.stringify(data));
    req.end();
  });
}

async function runTests() {
  console.log('=== STARTING VMS API VERIFICATION ===\n');

  // Test 1: Admin Login
  console.log('--- Test 1: Admin Login ---');
  const res1 = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, { username: 'admin', password: 'Admin@12345' });
  console.log('Status:', res1.status, '| Success:', res1.body?.success, '| Message:', res1.body?.message);

  // Test 2: Invalid Login
  console.log('\n--- Test 2: Invalid Password Login ---');
  const res2 = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, { username: 'admin', password: 'WrongPassword' });
  console.log('Status:', res2.status, '| Success:', res2.body?.success, '| Message:', res2.body?.message);

  // Test 3: Visitor Portal Registration (Weak Password)
  console.log('\n--- Test 3: Visitor Portal Register (Weak Password) ---');
  const res3 = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/visitor-portal/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    username: 'testvis1',
    email: 'testvis1@example.com',
    password: 'weak',
    fullName: 'Test Visitor',
    phone: '+94770000001',
    idProofType: 'NATIONAL_ID',
    idProofNumber: '990001111V'
  });
  console.log('Status:', res3.status, '| Message:', res3.body?.message, '| Errors:', res3.body?.errors);

  // Test 4: Visitor Portal Registration (Valid Data)
  console.log('\n--- Test 4: Visitor Portal Register (Valid Data) ---');
  const testUsername = `vis${Date.now()}`;
  const testEmail = `vis${Date.now()}@example.com`;
  const res4 = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/visitor-portal/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    username: testUsername,
    email: testEmail,
    password: 'Visitor@12345',
    fullName: 'Test Visitor One',
    phone: '+94770000002',
    idProofType: 'NATIONAL_ID',
    idProofNumber: `ID${Date.now()}`
  });
  console.log('Status:', res4.status, '| Message:', res4.body?.message);

  // Test 5: Duplicate Username Check
  console.log('\n--- Test 5: Duplicate Username Check ---');
  const res5 = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/visitor-portal/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    username: testUsername, // Same username
    email: `other${Date.now()}@example.com`,
    password: 'Visitor@12345',
    fullName: 'Test Visitor Two',
    phone: '+94770000003',
    idProofType: 'PASSPORT',
    idProofNumber: `ID2${Date.now()}`
  });
  console.log('Status:', res5.status, '| Message:', res5.body?.message);

  // Test 6: Duplicate Email Check
  console.log('\n--- Test 6: Duplicate Email Check ---');
  const res6 = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/visitor-portal/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    username: `other${Date.now()}`,
    email: testEmail, // Same email
    password: 'Visitor@12345',
    fullName: 'Test Visitor Three',
    phone: '+94770000004',
    idProofType: 'PASSPORT',
    idProofNumber: `ID3${Date.now()}`
  });
  console.log('Status:', res6.status, '| Message:', res6.body?.message);

  // Test 7: Security Gate Pass QR Verification (Raw token & Structured JSON)
  console.log('\n--- Test 7: Security Officer Login & Gate Pass QR Verification ---');
  const secLogin = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, { username: 'security1', password: 'Security@12345' });
  const secToken = secLogin.body?.data?.accessToken;
  console.log('Security Officer Token acquired:', !!secToken);

  // Create a visit & gate pass via Prisma directly for fast verification
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  const gatePassService = require('./src/services/gatePass.service');

  const visitor = await prisma.visitor.findFirst();
  const host = await prisma.employee.findFirst();
  const dept = await prisma.department.findFirst();
  const adminUser = await prisma.user.findFirst({ where: { username: 'admin' } });

  if (visitor && host && dept && adminUser) {
    const visit = await prisma.visit.create({
      data: {
        visitorId: visitor.visitorId,
        hostEmployeeId: host.employeeId,
        departmentId: dept.departmentId,
        purpose: 'Security Verification Testing',
        visitStatus: 'Approved',
        approvedBy: adminUser.userId,
        visitDate: new Date(),
      },
    });

    const pass = await gatePassService.generateGatePass(visit.visitId);
    console.log('Generated test GatePass:', pass.passNumber, '| validFrom:', pass.validFrom, '| validUntil:', pass.validUntil);

    // Verify via raw token
    const verifyRaw = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/security/verify-gate-pass',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${secToken}`
      },
    }, { qrToken: pass.qrToken });
    console.log('Raw Token Verify Status:', verifyRaw.status, '| Success:', verifyRaw.body?.success, '| Message:', verifyRaw.body?.message, '| Visitor:', verifyRaw.body?.data?.visit?.visitor?.firstName);

    // Verify via Structured JSON QR payload
    const jsonPayload = JSON.stringify({
      type: 'vms-gate-pass',
      version: 1,
      passNumber: pass.passNumber,
      token: pass.qrToken
    });

    const verifyJson = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/security/verify-gate-pass',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${secToken}`
      },
    }, { qrToken: jsonPayload });
    console.log('Structured JSON QR Verify Status:', verifyJson.status, '| Success:', verifyJson.body?.success, '| Message:', verifyJson.body?.message, '| Visitor:', verifyJson.body?.data?.visit?.visitor?.firstName);

    // Test 8: Future Gate Pass Verification
    const futureVisit = await prisma.visit.create({
      data: {
        visitorId: visitor.visitorId,
        hostEmployeeId: host.employeeId,
        departmentId: dept.departmentId,
        purpose: 'Future Date Verification Test',
        visitStatus: 'Approved',
        approvedBy: adminUser.userId,
        visitDate: new Date('2026-09-30T10:00:00.000Z'),
      },
    });
    const futurePass = await gatePassService.generateGatePass(futureVisit.visitId);
    const verifyFuture = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/security/verify-gate-pass',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${secToken}` },
    }, { qrToken: futurePass.passNumber });
    console.log('\n--- Test 8: Future Gate Pass Verify ---');
    console.log('Pass:', futurePass.passNumber, '| Status:', verifyFuture.status, '| Message:', verifyFuture.body?.message);

    // Test 9: Expired Gate Pass Verification
    const expiredVisit = await prisma.visit.create({
      data: {
        visitorId: visitor.visitorId,
        hostEmployeeId: host.employeeId,
        departmentId: dept.departmentId,
        purpose: 'Expired Date Verification Test',
        visitStatus: 'Approved',
        approvedBy: adminUser.userId,
        visitDate: new Date('2026-09-15T10:00:00.000Z'),
      },
    });
    const expiredPass = await gatePassService.generateGatePass(expiredVisit.visitId);
    const verifyExpired = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/security/verify-gate-pass',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${secToken}` },
    }, { qrToken: expiredPass.passNumber });
    console.log('\n--- Test 9: Expired Gate Pass Verify ---');
    console.log('Pass:', expiredPass.passNumber, '| Status:', verifyExpired.status, '| Message:', verifyExpired.body?.message);
  }

  await prisma.$disconnect();
  console.log('\n=== VMS API VERIFICATION COMPLETE ===');
}

runTests().catch(console.error);
