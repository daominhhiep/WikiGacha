
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import axios from 'axios';

const url = new URL(
  process.env.DATABASE_URL || 'mysql://wikiuser:wikipass@localhost:3306/wikigacha',
);
const adapter = new PrismaMariaDb({
  host: url.hostname,
  port: parseInt(url.port) || 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.substring(1),
  connectionLimit: 10,
});
const prisma = new PrismaClient({ adapter });

async function getArticleStats(title: string) {
  const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageviews|langlinks&titles=${encodeURIComponent(title)}&pvipdays=30&redirects=1&origin=*`;
  const { data } = await axios.get(url, { headers: { 'User-Agent': 'WikiGacha-Maintenance/1.0' } });
  const pages = data?.query?.pages;
  if (!pages) return null;
  const pageId = Object.keys(pages)[0];
  const page = pages[pageId];
  if (!page || page.missing === '') return null;
  const pageViewsMap = page.pageviews || {};
  const pageViews = Object.values(pageViewsMap)
    .filter((v): v is number => typeof v === 'number')
    .reduce((sum, count) => sum + count, 0);
  const languageCount = page.langlinks ? page.langlinks.length : 0;
  return { pageViews, languageCount };
}

function deriveRarity(pageViews: number, avg: number) {
  if (pageViews >= avg * 500) return 'SSR';
  if (pageViews >= avg * 150) return 'SR';
  if (pageViews >= avg * 50) return 'S';
  if (pageViews >= avg * 10) return 'R';
  return 'N';
}

function deriveStats(summary: string, pageViews: number, languageCount: number) {
  const baseHp = 50;
  const baseAtk = 10;
  const baseDef = 10;
  const hpBonus = Math.floor(Math.log2(Math.max(1, languageCount)) * 15);
  const atkBonus = Math.floor(Math.log10(Math.max(1, pageViews)) * 10);
  const summaryLength = summary.length || 0;
  const defBonus = Math.floor(Math.min(summaryLength / 20, 50));
  return {
    hp: baseHp + hpBonus,
    atk: baseAtk + atkBonus,
    def: baseDef + defBonus,
  };
}

async function main() {
  const cards = await prisma.card.findMany();
  console.log(`Refreshing ${cards.length} cards...`);
  const avg = 1500; // Approximate average

  for (const card of cards) {
    try {
      const stats = await getArticleStats(card.title);
      if (stats) {
        const rarity = deriveRarity(stats.pageViews, avg);
        const gameStats = deriveStats(card.summary, stats.pageViews, stats.languageCount);
        
        if (card.pageViews !== stats.pageViews) {
            console.log(`Updating ${card.title}: PV ${card.pageViews} -> ${stats.pageViews} (Rarity: ${card.rarity} -> ${rarity})`);
            await prisma.card.update({
              where: { id: card.id },
              data: {
                pageViews: stats.pageViews,
                languageCount: stats.languageCount,
                rarity: rarity as any,
                hp: gameStats.hp,
                atk: gameStats.atk,
                def: gameStats.def,
              }
            });
        }
      }
      await new Promise(r => setTimeout(r, 50));
    } catch (e) {
      console.error(`Error updating ${card.title}: ${e.message}`);
    }
  }
}

main().finally(() => prisma.$disconnect());
