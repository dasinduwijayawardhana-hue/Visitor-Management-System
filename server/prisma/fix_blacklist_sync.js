/**
 * fix_blacklist_sync.js
 * =====================================================================
 * One-time repair script.
 *
 * Finds visitors whose isBlacklisted=true but have NO ACTIVE entry
 * in blacklisted_persons, and clears the stale flag.
 *
 * Also finds visitors with ACTIVE blacklisted_persons entry but
 * isBlacklisted=false and sets it true.
 *
 * Run: node prisma/fix_blacklist_sync.js
 * =====================================================================
 */
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  // ── Case 1: visitor says blacklisted, but no ACTIVE entry exists ─────
  const blacklistedVisitors = await p.visitor.findMany({ where: { isBlacklisted: true } });

  for (const v of blacklistedVisitors) {
    const active = await p.blacklistedPerson.findFirst({
      where: { visitorId: v.visitorId, status: 'ACTIVE' },
    });
    if (!active) {
      await p.visitor.update({ where: { visitorId: v.visitorId }, data: { isBlacklisted: false } });
      console.log(`FIXED (cleared stale flag): visitorId=${v.visitorId} ${v.firstName} ${v.lastName}`);
    }
  }

  // ── Case 2: ACTIVE entry exists but visitor flag is false ─────────────
  const activeEntries = await p.blacklistedPerson.findMany({
    where: { status: 'ACTIVE', visitorId: { not: null } },
  });

  for (const entry of activeEntries) {
    const visitor = await p.visitor.findUnique({ where: { visitorId: entry.visitorId } });
    if (visitor && !visitor.isBlacklisted) {
      await p.visitor.update({ where: { visitorId: entry.visitorId }, data: { isBlacklisted: true } });
      console.log(`FIXED (set flag): visitorId=${visitor.visitorId} ${visitor.firstName} ${visitor.lastName}`);
    }
  }

  console.log('\nSync repair complete.');
}

main().catch(console.error).finally(() => p.$disconnect());
