const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const bv = await p.visitor.findMany({
    where: { isBlacklisted: true },
    select: { visitorId: true, firstName: true, lastName: true, idProofType: true, idProofNumber: true, phone: true }
  });
  console.log('\n=== Blacklisted visitors (visitors table) ===');
  bv.forEach(v => console.log(`  visitorId=${v.visitorId}  ${v.firstName} ${v.lastName}  [${v.idProofType}: ${v.idProofNumber}]  phone=${v.phone}`));

  const bp = await p.blacklistedPerson.findMany({
    select: { id: true, visitorId: true, fullName: true, idProofNumber: true, phone: true, status: true }
  });
  console.log('\n=== blacklisted_persons table ===');
  bp.forEach(r => console.log(`  id=${r.id}  visitorId=${r.visitorId}  ${r.fullName}  idProofNumber=${r.idProofNumber}  phone=${r.phone}  status=${r.status}`));

  // Find gaps
  const bpVisitorIds = new Set(bp.filter(r => r.status === 'ACTIVE').map(r => r.visitorId));
  const missing = bv.filter(v => !bpVisitorIds.has(v.visitorId));
  console.log('\n=== MISSING from blacklisted_persons (status=ACTIVE) ===');
  missing.forEach(v => console.log(`  visitorId=${v.visitorId}  ${v.firstName} ${v.lastName}`));
}
main().catch(console.error).finally(() => p.$disconnect());
