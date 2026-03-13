import { BattleEngine, BattleParticipant } from './battle-engine';

describe('BattleEngine', () => {
  let engine: BattleEngine;

  beforeEach(() => {
    engine = new BattleEngine();
  });

  it('should be defined', () => {
    expect(engine).toBeDefined();
  });

  describe('simulate', () => {
    it('should resolve a simple 1v1 battle where P1 wins', () => {
      const p1: BattleParticipant = {
        id: 'player1',
        cards: [
          { instanceId: 'p1c1', title: 'Strong Card', hp: 100, maxHp: 100, atk: 50, def: 10 }
        ]
      };
      const p2: BattleParticipant = {
        id: 'player2',
        cards: [
          { instanceId: 'p2c1', title: 'Weak Card', hp: 30, maxHp: 30, atk: 10, def: 5 }
        ]
      };

      const result = engine.simulate(p1, p2);

      expect(result.winnerId).toBe('player1');
      expect(result.log.length).toBeGreaterThan(0);
      const lastEntry = result.log[result.log.length - 1];
      expect(lastEntry.defenderId).toBe('p2c1');
      expect(lastEntry.isDefeated).toBe(true);
      expect(lastEntry.hpRemaining).toBe(0);
    });

    it('should resolve a simple 1v1 battle where P2 wins', () => {
      const p1: BattleParticipant = {
        id: 'player1',
        cards: [
          { instanceId: 'p1c1', title: 'Weak Card', hp: 30, maxHp: 30, atk: 10, def: 5 }
        ]
      };
      const p2: BattleParticipant = {
        id: 'player2',
        cards: [
          { instanceId: 'p2c1', title: 'Strong Card', hp: 100, maxHp: 100, atk: 50, def: 10 }
        ]
      };

      const result = engine.simulate(p1, p2);

      expect(result.winnerId).toBe('player2');
      expect(result.log.length).toBeGreaterThan(0);
      const lastEntry = result.log[result.log.length - 1];
      expect(lastEntry.defenderId).toBe('p1c1');
      expect(lastEntry.isDefeated).toBe(true);
    });

    it('should handle a 3v3 battle', () => {
      const p1: BattleParticipant = {
        id: 'player1',
        cards: [
          { instanceId: 'p1c1', title: 'Card A', hp: 100, maxHp: 100, atk: 30, def: 10 },
          { instanceId: 'p1c2', title: 'Card B', hp: 100, maxHp: 100, atk: 30, def: 10 },
          { instanceId: 'p1c3', title: 'Card C', hp: 100, maxHp: 100, atk: 30, def: 10 },
        ]
      };
      const p2: BattleParticipant = {
        id: 'player2',
        cards: [
          { instanceId: 'p2c1', title: 'Card X', hp: 50, maxHp: 50, atk: 10, def: 5 },
          { instanceId: 'p2c2', title: 'Card Y', hp: 50, maxHp: 50, atk: 10, def: 5 },
          { instanceId: 'p2c3', title: 'Card Z', hp: 50, maxHp: 50, atk: 10, def: 5 },
        ]
      };

      const result = engine.simulate(p1, p2);

      expect(result.winnerId).toBe('player1');
      // Verify that all cards on P2 side are defeated in the final state if p1 won
      // Since it's a simulation, we'd need to track state externally if we wanted to be sure
      // but checking the last log entry is usually enough.
      expect(result.log[result.log.length - 1].isDefeated).toBe(true);
    });

    it('should respect the max turns safety break', () => {
      // Create two immortal cards (very high HP, low ATK, high DEF)
      const p1: BattleParticipant = {
        id: 'player1',
        cards: [
          { instanceId: 'p1c1', title: 'Immortal 1', hp: 1000, maxHp: 1000, atk: 5, def: 100 }
        ]
      };
      const p2: BattleParticipant = {
        id: 'player2',
        cards: [
          { instanceId: 'p2c1', title: 'Immortal 2', hp: 1000, maxHp: 1000, atk: 5, def: 100 }
        ]
      };

      const result = engine.simulate(p1, p2);

      // Max turns is 100. Each attack is a turn.
      // damage = max(1, 5 - 100) = 1.
      // After 100 turns, both should still be alive.
      expect(result.log.length).toBeLessThanOrEqual(101); // 100 or slightly more depending on loop
      expect(result.log.every(e => !e.isDefeated)).toBe(true);
      expect(result.winnerId).toBeDefined();
    });
    
    it('should calculate damage as max(1, atk - def)', () => {
      const p1: BattleParticipant = {
        id: 'player1',
        cards: [
          { instanceId: 'p1c1', title: 'Attacker', hp: 100, maxHp: 100, atk: 20, def: 0 }
        ]
      };
      const p2: BattleParticipant = {
        id: 'player2',
        cards: [
          { instanceId: 'p2c1', title: 'Defender', hp: 100, maxHp: 100, atk: 0, def: 15 }
        ]
      };

      const result = engine.simulate(p1, p2);
      
      // Turn 1: P1 attacks P2. Damage = 20 - 15 = 5.
      expect(result.log[0].damage).toBe(5);
      expect(result.log[0].hpRemaining).toBe(95);
    });
  });
});
