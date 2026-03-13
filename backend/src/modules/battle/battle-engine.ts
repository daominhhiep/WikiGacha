export interface BattleCard {
  instanceId: string;
  title: string;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
}

export interface BattleParticipant {
  id: string;
  cards: BattleCard[];
}

export interface BattleLogEntry {
  turn: number;
  attackerId: string;
  attackerName: string;
  defenderId: string;
  defenderName: string;
  damage: number;
  hpRemaining: number;
  isDefeated: boolean;
}

export interface BattleResult {
  winnerId: string;
  log: BattleLogEntry[];
}

export class BattleEngine {
  simulate(p1: BattleParticipant, p2: BattleParticipant): BattleResult {
    const log: BattleLogEntry[] = [];
    const p1Cards = p1.cards.map(c => ({ ...c }));
    const p2Cards = p2.cards.map(c => ({ ...c }));
    
    let turn = 1;
    const maxTurns = 100; // Safety break

    while (turn <= maxTurns) {
      // Player 1 turn
      for (const attacker of p1Cards.filter(c => c.hp > 0)) {
        const defenders = p2Cards.filter(c => c.hp > 0);
        if (defenders.length === 0) break;
        
        const defender = defenders[Math.floor(Math.random() * defenders.length)];
        const damage = Math.max(1, attacker.atk - defender.def);
        defender.hp -= damage;
        
        log.push({
          turn,
          attackerId: attacker.instanceId,
          attackerName: attacker.title,
          defenderId: defender.instanceId,
          defenderName: defender.title,
          damage,
          hpRemaining: Math.max(0, defender.hp),
          isDefeated: defender.hp <= 0,
        });
        
        turn++;
      }
      
      if (p2Cards.every(c => c.hp <= 0)) return { winnerId: p1.id, log };

      // Player 2 turn
      for (const attacker of p2Cards.filter(c => c.hp > 0)) {
        const defenders = p1Cards.filter(c => c.hp > 0);
        if (defenders.length === 0) break;
        
        const defender = defenders[Math.floor(Math.random() * defenders.length)];
        const damage = Math.max(1, attacker.atk - defender.def);
        defender.hp -= damage;
        
        log.push({
          turn,
          attackerId: attacker.instanceId,
          attackerName: attacker.title,
          defenderId: defender.instanceId,
          defenderName: defender.title,
          damage,
          hpRemaining: Math.max(0, defender.hp),
          isDefeated: defender.hp <= 0,
        });
        
        turn++;
      }

      if (p1Cards.every(c => c.hp <= 0)) return { winnerId: p2.id, log };
    }

    // If max turns reached, winner is the one with more total HP remaining
    const p1TotalHp = p1Cards.reduce((sum, c) => sum + Math.max(0, c.hp), 0);
    const p2TotalHp = p2Cards.reduce((sum, c) => sum + Math.max(0, c.hp), 0);
    
    return {
      winnerId: p1TotalHp >= p2TotalHp ? p1.id : p2.id,
      log
    };
  }
}
