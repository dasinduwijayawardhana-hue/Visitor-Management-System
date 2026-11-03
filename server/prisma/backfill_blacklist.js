/**
 * backfill_blacklist.js
 * =====================================================================
 * One-time migration script.
 * Copies all existing visitors where isBlacklisted = true into the new
 * blacklisted_persons table so existing data isn't lost.
 *
 * Run with:   node backfill_blacklist.js
 * =====================================================================
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Find the first Admin user to use as the createdBy owner for backfilled entries
  const adminUser = await prisma.user.findFirst({
    where: { role: { roleName: 'Admin' }, isActive: true },
    orderBy: { userId: 'asc' },
  });

  if (!adminUser) {
    console.error('No active Admin user found. Cannot backfill without a valid createdByUserId.');
    process.exit(1);
  }

  console.log(`Using admin: ${adminUser.fullName} (userId=${adminUser.userId}) for backfill.`);

  const blacklistedVisitors = await prisma.visitor.findMany({
    where: { isBlacklisted: true },
  });

  console.log(`Found ${blacklistedVisitors.length} blacklisted visitor(s) to migrate.`);

  let created = 0;
  let skipped = 0;

  for (const v of blacklistedVisitors) {
    // Check if an ACTIVE entry already exists for this visitor
    const existing = await prisma.blacklistedPerson.findFirst({
      where: {
        status: 'ACTIVE',
        OR: [
          { idProofNumber: v.idProofNumber },
          { phone: v.phone },
        ],
      },
    });

    if (existing) {
      console.log(`  SKIP  visitorId=${v.visitorId} — entry already exists (blacklistId=${existing.id})`);
      skipped++;
      continue;
    }

    await prisma.blacklistedPerson.create({
      data: {
        visitorId: v.visitorId,
        fullName: `${v.firstName} ${v.lastName}`,
        idProofType: v.idProofType,
        idProofNumber: v.idProofNumber,
        phone: v.phone,
        blacklistReason: 'Migrated from legacy isBlacklisted flag (pre-v2 blacklist system).',
        status: 'ACTIVE',
        createdByUserId: adminUser.userId,
      },
    });

    console.log(`  OK    visitorId=${v.visitorId} → ${v.firstName} ${v.lastName} [${v.idProofType}: ${v.idProofNumber}]`);
    created++;
  }

  console.log(`\nBackfill complete. Created: ${created}, Skipped: ${skipped}.`);
}

main()
  .catch((err) => {
    console.error('Backfill failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
