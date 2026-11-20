/**
 * Weekly scoring job — run by the Render cron job every Monday 06:00 UTC.
 *
 * Phase 1: placeholder so the cron service deploys cleanly.
 * Phase 3: pulls Wikipedia pageviews, combines them with logged events,
 * finalizes last week's matchups, updates standings, and advances playoffs.
 */
import { prisma } from '../lib/prisma';

async function main() {
  const leagues = await prisma.league.count({ where: { status: { in: ['IN_SEASON', 'PLAYOFFS'] } } });
  console.log(`[weekly] ${leagues} active league(s). Scoring is implemented in Phase 3.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
