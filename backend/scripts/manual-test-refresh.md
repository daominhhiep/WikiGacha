# Manual Test Instructions for refresh-cards.ts

## Purpose
To verify that the `refresh-cards.ts` script correctly populates the `tier` and `category` fields for all existing cards in the database.

## Prerequisites
1. Ensure the backend dependencies are installed: `npm install` (in `backend/` directory)
2. Ensure the database is running and accessible via `DATABASE_URL` in `.env`.
3. Ensure there are existing cards in the `Card` table.

## Steps
1. **Check current state:**
   Check a few cards in the database to see if `tier` or `category` is NULL.
   ```bash
   # In backend directory
   npx prisma studio
   ```
   Or use MySQL client:
   ```sql
   SELECT title, rarity, tier, category FROM Card LIMIT 5;
   ```

2. **Run the script:**
   Execute the script using `ts-node`:
   ```bash
   # In backend directory
   npx ts-node scripts/refresh-cards.ts
   ```

3. **Verify output:**
   The console should log progress for each card:
   `Updating [Title]: Rarity [Rarity] -> Tier [Tier], Category [Category]`

4. **Verify database state:**
   Re-check the database to ensure the fields are now populated.
   ```sql
   SELECT title, rarity, tier, category FROM Card LIMIT 5;
   ```
   All cards should now have non-null `tier` and `category` values.
