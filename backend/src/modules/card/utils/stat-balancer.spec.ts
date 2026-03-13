import { StatBalancer } from './stat-balancer';
import { Rarity, Tier, Category } from '../../../generated/prisma/client';

describe('StatBalancer', () => {
  describe('deriveStats', () => {
    it('should calculate base stats for a common card', () => {
      // 0 views, 0 length, 0 langs should give min stats
      const stats = StatBalancer.deriveStats(0, 0, 0, Rarity.C);
      expect(stats.hp).toBe(50);
      expect(stats.atk).toBe(10);
      expect(stats.def).toBe(10);
    });

    it('should reach max stats with high metrics for common card', () => {
      // 1M views, 100k length, 100 langs should reach max base
      const stats = StatBalancer.deriveStats(1000000, 100000, 100, Rarity.C);
      expect(stats.hp).toBe(500);
      expect(stats.atk).toBe(100);
      expect(stats.def).toBe(100);
    });

    it('should apply multiplier for high rarity cards and clamp', () => {
      // SSR has 2.0x multiplier
      // Even with mid metrics, it should hit cap earlier
      const stats = StatBalancer.deriveStats(1000, 1000, 10, Rarity.SSR);

      // HP: log10(10+1) = 1.04. Score = 1.04 / 2 = 0.52. 0.52 * 450 + 50 = 284. 284 * 2 = 568 -> 500.
      expect(stats.hp).toBe(500);

      // ATK: log10(1000+1) = 3. Score = 3 / 6 = 0.5. 0.5 * 90 + 10 = 55. 55 * 2 = 110 -> 100.
      expect(stats.atk).toBe(100);
    });

    it('should return minimum stats even with multiplier if metrics are zero', () => {
      const stats = StatBalancer.deriveStats(0, 0, 0, Rarity.SSR);
      // min * 2.0 = 50 * 2.0 = 100 for HP
      expect(stats.hp).toBe(100);
      expect(stats.atk).toBe(20);
      expect(stats.def).toBe(20);
    });
  });

  describe('deriveCategory', () => {
    it('should identify SCIENCE', () => {
      expect(StatBalancer.deriveCategory('Quantum Physics', 'A study of atoms')).toBe(
        Category.SCIENCE,
      );
      expect(StatBalancer.deriveCategory('Software Engineering', 'Building digital systems')).toBe(
        Category.SCIENCE,
      );
    });

    it('should identify ART', () => {
      expect(StatBalancer.deriveCategory('The Starry Night', 'A painting by Van Gogh')).toBe(
        Category.ART,
      );
      expect(
        StatBalancer.deriveCategory('Beethoven Symphony No. 9', 'Famous musical composition'),
      ).toBe(Category.ART);
    });

    it('should identify GEOGRAPHY', () => {
      expect(StatBalancer.deriveCategory('Mount Everest', 'Highest mountain in the world')).toBe(
        Category.GEOGRAPHY,
      );
      expect(StatBalancer.deriveCategory('Tokyo', 'Capital city of Japan')).toBe(
        Category.GEOGRAPHY,
      );
    });

    it('should identify ENTERTAINMENT', () => {
      expect(StatBalancer.deriveCategory('Super Mario Bros', 'A video game by Nintendo')).toBe(
        Category.ENTERTAINMENT,
      );
      expect(StatBalancer.deriveCategory('Wimbledon Championship', 'Tennis tournament')).toBe(
        Category.ENTERTAINMENT,
      );
    });

    it('should default to HISTORY', () => {
      expect(StatBalancer.deriveCategory('Roman Empire', 'Ancient civilization')).toBe(
        Category.HISTORY,
      );
      expect(StatBalancer.deriveCategory('Unknown Topic', 'Random text')).toBe(Category.HISTORY);
    });
  });

  describe('getTier', () => {
    it('should map rarities to correct tiers', () => {
      expect(StatBalancer.getTier(Rarity.C)).toBe(Tier.COMMON);
      expect(StatBalancer.getTier(Rarity.UC)).toBe(Tier.RARE);
      expect(StatBalancer.getTier(Rarity.R)).toBe(Tier.RARE);
      expect(StatBalancer.getTier(Rarity.SR)).toBe(Tier.SUPER_RARE);
      expect(StatBalancer.getTier(Rarity.SSR)).toBe(Tier.SPEC_SUPER_RARE);
      expect(StatBalancer.getTier(Rarity.UR)).toBe(Tier.SPEC_SUPER_RARE);
      expect(StatBalancer.getTier(Rarity.LR)).toBe(Tier.SPEC_SUPER_RARE);
    });
  });
});
