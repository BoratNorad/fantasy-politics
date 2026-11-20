/**
 * Seeds the player pool. Runs on every deploy but ONLY inserts when the Player
 * table is empty, so admin-panel edits are never overwritten.
 *
 * To force a reseed locally: `npm run seed --workspace server -- --force`
 * (this deletes all players that aren't referenced by draft picks).
 */
import { COUNTRIES } from '@fp/shared';
import { PrismaClient } from '@prisma/client';
import { SEED_PLAYERS } from './players';

const prisma = new PrismaClient();

/** Turn tier + list order into a default draft rank (1 = best). */
function buildRows() {
  const indexed = SEED_PLAYERS.map((row, i) => ({ row, i }));
  indexed.sort((a, b) => a.row[4] - b.row[4] || a.i - b.i);
  return indexed.map(({ row }, rankIdx) => {
    const [country, position, name, officeTitle, , opts = {}] = row;
    const nativeLang = COUNTRIES[country]?.wikiLang;
    return {
      country,
      position,
      name,
      officeTitle,
      wikiTitle: opts.wiki ?? name,
      // Native-language article titles differ per wiki; admin fills these in.
      nativeWikiLang: nativeLang && nativeLang !== 'en' ? nativeLang : null,
      status: opts.status ?? 'ACTIVE',
      defaultRank: rankIdx + 1,
      needsVerification: true,
      adminNotes: opts.note ?? null,
    } as const;
  });
}

async function main() {
  const force = process.argv.includes('--force');
  const existing = await prisma.player.count();
  if (existing > 0 && !force) {
    console.log(`[seed] ${existing} players already present — skipping.`);
    return;
  }
  if (force) {
    const del = await prisma.player.deleteMany({ where: { draftPicks: { none: {} } } });
    console.log(`[seed] --force: deleted ${del.count} players.`);
  }
  const rows = buildRows();
  const res = await prisma.player.createMany({ data: rows });
  console.log(`[seed] Inserted ${res.count} players (all flagged "needs verification").`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
