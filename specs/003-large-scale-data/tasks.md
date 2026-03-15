# Tasks: Wikipedia 7M Record Data Ingestion

**Input**: Plan from `/specs/003-large-scale-data/plan.md`
**Prerequisites**: Project stable (V2 finished)

## Phase 1: Database Schema Optimization (MySQL)

**Goal**: Optimize the `Card` table for 7M records.

- [ ] T001 Update Prisma schema with new indexes: `idx_card_rarity`, `idx_card_popularity`, `idx_card_title` (Fulltext)
- [ ] T002 Update Prisma schema to use `@db.UnsignedInt` for numeric stats (hp, atk, def, pageViews)
- [ ] T003 Run prisma migration: `npx prisma migrate dev --name optimize_card_table`
- [ ] T004 Manually apply MySQL partitioning by `rarity` (Prisma does not support partitioning natively yet)

## Phase 2: ETL Pipeline - Extraction & Transformation

**Goal**: Implement high-speed parsing for Wikipedia dumps.

- [ ] T005 Create `WikiETLModule` in `backend/src/modules/etl/`
- [ ] T006 Implement SQL dump parser for `enwiki-latest-page.sql.gz`
- [ ] T007 Implement PageView parser for popularity data
- [ ] T008 Implement XML abstract parser for summaries
- [ ] T009 Implement `StatGenerator` for deterministic stat calculation based on popularity percentiles

## Phase 3: ETL Pipeline - Loading

**Goal**: Load millions of records efficiently.

- [ ] T010 Implement `BulkLoaderService` using `LOAD DATA INFILE` or optimized `createMany`
- [ ] T011 Create a CLI command to trigger the ETL process: `npm run etl:ingest`
- [ ] T012 Implement batching and progress tracking for the ingestion process

## Phase 4: Scaling & Performance

**Goal**: Ensure gacha and search remain fast with 7M records.

- [ ] T013 Optimize Gacha logic in `CardService` to use rarity-based buckets instead of `ORDER BY RAND()`
- [ ] T014 Implement Redis-based "Active Pool" caching for top 100k cards
- [ ] T015 Implement Full-Text search endpoint for cards by title

## Phase 5: Validation & Maintenance

- [ ] T016 Create a smoke test for 7M record lookup performance
- [ ] T017 Document the ETL process and monthly sync procedure in `README.md`
- [ ] T018 Update `PROJECT_OVERVIEW.md` with V3 features
