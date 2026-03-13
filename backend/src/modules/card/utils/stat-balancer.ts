import { Rarity, Tier, Category } from '../../../generated/prisma/client';

export class StatBalancer {
  private static readonly RANGES = {
    hp: { min: 50, max: 500 },
    atk: { min: 10, max: 100 },
    def: { min: 10, max: 100 },
  };

  private static readonly LOG_LIMITS = {
    pageViews: 6, // 1,000,000
    length: 5, // 100,000
    languageCount: 2, // 100
  };

  private static readonly TIER_MAPPING: Record<Rarity, { tier: Tier; mult: number }> = {
    [Rarity.C]: { tier: Tier.COMMON, mult: 1.0 },
    [Rarity.UC]: { tier: Tier.RARE, mult: 1.2 },
    [Rarity.R]: { tier: Tier.RARE, mult: 1.2 },
    [Rarity.SR]: { tier: Tier.SUPER_RARE, mult: 1.5 },
    [Rarity.SSR]: { tier: Tier.SPEC_SUPER_RARE, mult: 2.0 },
    [Rarity.UR]: { tier: Tier.SPEC_SUPER_RARE, mult: 2.0 },
    [Rarity.LR]: { tier: Tier.SPEC_SUPER_RARE, mult: 2.0 },
  };

  /**
   * Derives HP, ATK, and DEF from Wikipedia metrics.
   * Uses log10 scaling and normalizes to game ranges.
   */
  static deriveStats(
    pageViews: number,
    length: number,
    languageCount: number,
    rarity: string,
  ): { hp: number; atk: number; def: number } {
    const rarityEnum = rarity as Rarity;
    const mapping = this.TIER_MAPPING[rarityEnum] || this.TIER_MAPPING[Rarity.C];
    const mult = mapping.mult;

    // Mapping:
    // HP <- languageCount
    // ATK <- pageViews
    // DEF <- length
    const hpBase = this.normalize(languageCount, this.LOG_LIMITS.languageCount, this.RANGES.hp);
    const atkBase = this.normalize(pageViews, this.LOG_LIMITS.pageViews, this.RANGES.atk);
    const defBase = this.normalize(length, this.LOG_LIMITS.length, this.RANGES.def);

    return {
      hp: this.clamp(Math.floor(hpBase * mult), this.RANGES.hp.min, this.RANGES.hp.max),
      atk: this.clamp(Math.floor(atkBase * mult), this.RANGES.atk.min, this.RANGES.atk.max),
      def: this.clamp(Math.floor(defBase * mult), this.RANGES.def.min, this.RANGES.def.max),
    };
  }

  /**
   * Helper to get the Tier enum from a Rarity string.
   */
  static getTier(rarity: string): Tier {
    const rarityEnum = rarity as Rarity;
    return (this.TIER_MAPPING[rarityEnum] || this.TIER_MAPPING[Rarity.C]).tier;
  }

  /**
   * Derives a category based on keywords in title and summary.
   */
  static deriveCategory(title: string, summary: string): Category {
    const text = (title + ' ' + (summary || '')).toLowerCase();

    // Science & Tech
    if (
      /\b(science|physics|chemistry|biology|mathematics|technology|engineering|space|planet|star|atom|molecule|evolution|genetics|research|discovery|invention|laboratory|experiment|astronomy|geology|meteorology|ecology|neuroscience|psychology|software|computer|digital|tech)\b/.test(
        text,
      )
    ) {
      return Category.SCIENCE;
    }

    // Geography & Nature
    if (
      /\b(city|town|village|country|island|mountain|river|ocean|lake|desert|region|location|place|province|state|territory|continent|geography|map|landmark|forest|park|reserve|wildlife|nature|natural)\b/.test(
        text,
      )
    ) {
      return Category.GEOGRAPHY;
    }

    // Art & Literature
    if (
      /\b(art|music|musical|film|movie|painting|painter|sculpture|sculptor|literature|poetry|theater|theatre|architecture|design|artist|musician|writer|actor|director|composer|composition|singer|band|orchestra|album|novel|poem|play|opera|ballet)\b/.test(
        text,
      )
    ) {
      return Category.ART;
    }

    // Entertainment & Sports
    if (
      /\b(game|sport|celebrity|festival|holiday|leisure|hobby|entertainment|tv|television|radio|anime|manga|cartoon|comics|superhero|video game|football|basketball|baseball|soccer|tennis|golf|racing|olympic)\b/.test(
        text,
      )
    ) {
      return Category.ENTERTAINMENT;
    }

    // Default to History
    return Category.HISTORY;
  }

  private static normalize(value: number, logLimit: number, range: { min: number; max: number }) {
    // Stat_raw = log10(value + 1)
    const logVal = Math.log10(Math.max(0, value) + 1);
    const score = Math.min(logVal / logLimit, 1);
    return score * (range.max - range.min) + range.min;
  }

  private static clamp(val: number, min: number, max: number) {
    return Math.max(min, Math.min(max, val));
  }
}
