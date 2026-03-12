import 'dotenv/config';
process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'mysql://wikiuser:wikipass@localhost:3306/wikigacha';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
