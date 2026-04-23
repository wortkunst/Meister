export type CardType = 'evil' | 'good';

export interface Card {
  id: string;
  value: number;
  type: CardType;
  name: string;
}

export interface Player {
  id: number;
  name: string;
  hand: Card[];
  successPile: Card[];
}

export type GamePhase =
  | 'setup'
  | 'pass_device'
  | 'play_phase1'
  | 'ready_to_reveal'
  | 'reveal_master'
  | 'play_phase3'
  | 'ready_to_resolve'
  | 'resolve_tie'
  | 'distribute_penalties'
  | 'round_end'
  | 'game_over';

export type WinTier = 'Gold' | 'Silver' | 'Bronze';

export interface TableState {
  [playerId: number]: {
    phase1: Card | null;
    phase3: Card | null;
    folded: boolean;
  };
}

export interface GameState {
  phase: GamePhase;
  nextPhase: GamePhase | null;
  players: Player[];
  deck: Card[];
  masterDeck: Card[];
  discardPile: Card[];
  round: number;
  startPlayerIdx: number;
  turnOrder: number[];
  currentTurnStep: number;
  table: TableState;
  masterCards: Card[];
  winners: number[];
  winTier: WinTier | null;
  penalties: Card[];
  penaltyAssignments: Record<string, number>;
  tieLogs: string[];
  tieDraws: { playerName: string; card: Card }[][];
}

export type GameAction =
  | { type: 'START_GAME'; payload: { playerNames: string[] } }
  | { type: 'PASS_DEVICE_DONE' }
  | { type: 'PLAY_CARD'; payload: { cardId: string } }
  | { type: 'PLAY_SCAPEGOAT'; payload: { cardId: string } }
  | { type: 'REVEAL_MASTER' }
  | { type: 'START_PHASE3' }
  | { type: 'RESOLVE_ROUND' }
  | { type: 'RESOLVE_TIE' }
  | { type: 'START_PENALTIES' }
  | { type: 'SET_PENALTY_ASSIGNMENT'; payload: { cardId: string; playerId: number } }
  | { type: 'SUBMIT_PENALTIES' }
  | { type: 'END_ROUND' };
