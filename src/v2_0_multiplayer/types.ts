export type CardType = 
  | 'Käfig'
  | 'Hinterhalt!'
  | 'Schrottrüstung'
  | 'Glitzerklunker'
  | 'Von hinten geschubst'
  | 'Lugloch'
  | 'Geheimfach'
  | 'Des Meisters Fluch'
  | 'Auswahlelixir'
  | 'Dynamit';

export type Card = {
  id: string;
  type: CardType;
  value: number;
};

export type DisplayItem = {
  id: string;
  card: Card;
  cagedBy?: Card;
  isSecret?: boolean;
  elixirUsed?: boolean;
  isBusted?: boolean;
  isFluchCanceled?: boolean;
  isHinterhaltDestroyed?: boolean;
  isEvaluated?: boolean;
};

export type GamePhase = 
  | 'setup'
  | 'elixir_decision'
  | 'playing'
  | 'lugloch_decision'
  | 'cage_decision'
  | 'hinterhalt_decision'
  | 'geschubst_decision'
  | 'geheimfach_decision'
  | 'round_end' 
  | 'game_over'
  | 'fluch_cancel_anim'
  | 'fluch_cancel_wait'
  | 'bust_wait'
  | 'bust_armor_wait'
  | 'bust_anim'
  | 'hinterhalt_anim';

export type Player = {
  id: number;
  name: string;
  userId?: string;
  score: number;
  roundScore: number;
  display: DisplayItem[];
  status: 'PLAYING' | 'STOPPED' | 'BUSTED';
};

export type GameState = {
  version: 'v2_0_multiplayer';
  players: Player[];
  currentPlayerIndex: number;
  deck: Card[];
  discardPile: Card[];
  phase: GamePhase;
  round: number;
  
  pendingCards: Card[];
  pendingActionCard?: Card;
  eventLog: { id: string, msg: string }[];
};
