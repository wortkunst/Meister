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
  | 'Langfinger'
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
  destroyedCageCard?: Card;
  isSecret?: boolean;
  elixirUsed?: boolean;
  luglochUsed?: boolean;
  geheimfachUsed?: boolean;
  isBusted?: boolean;
  isFluchCanceled?: boolean;
  isHinterhaltDestroyed?: boolean;
  isCageDestroying?: boolean;
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
  | 'langfinger_decision'
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
  score: number;
  roundScore: number;
  display: DisplayItem[];
  status: 'PLAYING' | 'STOPPED' | 'BUSTED';
};

export type GameState = {
  version: 'v3_0';
  players: Player[];
  currentPlayerIndex: number;
  deck: Card[];
  discardPile: Card[];
  phase: GamePhase;
  round: number;
  
  pendingCards: Card[];
  pendingActionCard?: Card;
  pendingBustCard?: Card;
  pendingBustPlayerId?: number;
  firstDynamitePlayerId?: number;
  eventLog: { id: string, msg: string }[];
};
