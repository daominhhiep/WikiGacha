import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { StatBalancer } from '../src/modules/card/utils/stat-balancer';
import 'dotenv/config';

async function main() {
  const url = new URL(
    process.env.DATABASE_URL || 'mysql://wikiuser:wikipass@localhost:3306/wikigacha',
  );
  
  const adapter = new PrismaMariaDb({
    host: url.hostname,
    port: parseInt(url.port) || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.substring(1),
    connectionLimit: 1,
  });
  
  const prisma = new PrismaClient({ adapter });

  try {
    const cards = await prisma.card.findMany();
    console.log(`Refreshing tier/category for ${cards.length} cards...`);

    let updatedCount = 0;
    let errorCount = 0;

    for (const card of cards) {
      try {
        const tier = StatBalancer.getTier(card.rarity);
        const category = StatBalancer.deriveCategory(card.title, card.summary);

        console.log(`Updating ${card.title}: Rarity ${card.rarity} -> Tier ${tier}, Category ${category}`);

        await prisma.card.update({
          where: { id: card.id },
          data: {
            tier,
            category,
          },
        });
        updatedCount++;
      } catch (e) {
        console.error(`Error updating ${card.title}: ${e.message}`);
        errorCount++;
      }
    }

    console.log(`Successfully updated ${updatedCount} cards.`);
    if (errorCount > 0) {
      console.log(`Failed to update ${errorCount} cards.`);
    }
  } catch (error) {
    console.error('Fatal error during refresh:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
