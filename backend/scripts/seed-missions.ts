import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import * as dotenv from 'dotenv';

dotenv.config();

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

async function main() {
  const missions = [
    {
      title: 'First Breach',
      description: 'Open your first card pack.',
      rewardCredits: 50,
      type: 'DAILY' as const,
      criteria: { type: 'PULL_CARDS', count: 1 },
    },
    {
      title: 'Novice Collector',
      description: 'Pull 10 cards to expand your library.',
      rewardCredits: 100,
      type: 'LIFETIME' as const,
      criteria: { type: 'PULL_CARDS', count: 10 },
    },
    {
      title: 'Arena Beginner',
      description: 'Win 3 battles against any opponent.',
      rewardCredits: 150,
      type: 'DAILY' as const,
      criteria: { type: 'WIN_BATTLES', count: 3 },
    },
  ];

  console.log('Seeding missions...');

  for (const missionData of missions) {
    const existingMission = await prisma.mission.findFirst({
        where: { title: missionData.title }
    });

    if (existingMission) {
        console.log(`Mission "${missionData.title}" already exists, updating...`);
        await prisma.mission.update({
            where: { id: existingMission.id },
            data: missionData
        });
    } else {
        console.log(`Creating mission "${missionData.title}"...`);
        await prisma.mission.create({
            data: missionData
        });
    }
  }

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
