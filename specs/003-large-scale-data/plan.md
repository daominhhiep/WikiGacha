# Plan: Wikipedia 7M Record Data Ingestion

**Objective**: Store 7 million English Wikipedia articles as playable cards in the Wikigacha database.

## 1. Database Schema Optimization (MySQL)

### Structural Changes
- **Primary Key**: `Card.id` (Wikipedia Page ID) remains the PK.
- **Indexes**:
    - `CREATE INDEX idx_card_rarity ON Card(rarity);`
    - `CREATE INDEX idx_card_popularity ON Card(popularity DESC);`
    - `CREATE FULLTEXT INDEX idx_card_title ON Card(title);`
- **Data Types**: Use `INT UNSIGNED` for `pageViews`, `hp`, `atk`, `def`. Use `TEXT` for `summary`.

### Partitioning
- Partition the `Card` table by `rarity` (Enum) to optimize "Gacha Pull" queries which often filter by rarity tiers.

## 2. ETL (Extract, Transform, Load) Pipeline

### Phase 1: Extraction (Avoid API)
- **Source**: [Wikimedia Dumps](https://dumps.wikimedia.org/enwiki/latest/)
- **Files**:
    - `enwiki-latest-page.sql.gz`: Basic metadata.
    - `enwiki-latest-page_views-*.gz`: Popularity data.
    - `enwiki-latest-abstract.xml.gz`: Summaries (Abstracts).

### Phase 2: Transformation
- **Tooling**: Node.js streams or Go for high-speed parsing.
- **Logic**:
    - Parse XML/SQL into JSON streams.
    - Calculate `popularity` based on view counts and link density.
    - Assign `rarity` based on percentile (e.g., Top 1000 = LR).
    - Generate base stats (HP/ATK/DEF) deterministically.

### Phase 3: Loading
- **Method**: `LOAD DATA INFILE` (MySQL Native)
- **Batching**: If using Prisma, `prisma.card.createMany({ data: batch, skipDuplicates: true })` in chunks of 5000.

## 3. Scaling & Performance

### Gacha Logic Optimization
- **Weighted Randomness**: Instead of `ORDER BY RAND()`, use a pre-calculated `random_seed` or rarity-based buckets in Redis.
- **Redis Caching**: Cache the "Active Pool" (e.g., top 100k most popular cards) in Redis for instant access.

### Search
- Implement a search proxy or use MySQL Full-Text search to handle 7M record lookups by title.

## 4. Resource Requirements
- **Disk Space**: ~20GB for raw data + ~40GB for MySQL (data + indexes).
- **RAM**: Minimum 8GB for MySQL buffer pool optimization.
- **Time**: Estimated 4-8 hours for full ingestion on a standard NVMe SSD.

## 5. Maintenance
- **Syncing**: Monthly delta updates from Wikipedia dumps.
- **Stat Rebalancing**: Background job to adjust stats based on evolving "Popularity" metrics.
