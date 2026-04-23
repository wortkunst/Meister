export type CardType = 'master' | 'servant';

export interface Card {
  id: string;
  value: number;
  type: CardType;
  hidden?: boolean;
}

export type PlayerStatus = 'ACTIVE' | 'STOPPED' | 'BUST';

export interface Player {
  id: number;
  name: string;
  score: number;
  roundTotal: number;
  status: PlayerStatus;
  cards: Card[];
  decision: 'WEITER' | 'STOP' | null;
}

export type GamePhase =
  | 'setup'
  | 'make_decision'
  | 'resolve_tie'
  | 'round_scoring'
  | 'game_over';

export interface GameState {
  phase: GamePhase;
  players: Player[];
  masterDeck: Card[];
  servantDeck: Card[];
  discardPile: Card[];
  currentMasterCard: Card | null;
  round: number;
  startingPlayerId: number;
  decisionQueue: number[];
  currentDecisionPlayerId: number | null;
  tiedPlayers: number[] | null;
  roundResults: {
    playerId: number;
    scoreDelta: number;
  }[] | null;
}

export type GameAction =
  | { type: 'START_GAME'; payload: { playerNames: string[] } }
  | { type: 'MAKE_DECISION'; payload: { decision: 'WEITER' | 'STOP' } }
  | { type: 'REVEAL_DECISIONS' }
  | { type: 'UBEREIFRIG' }
  | { type: 'SCORE_ROUND' }
  | { type: 'START_NEXT_ROUND' };
