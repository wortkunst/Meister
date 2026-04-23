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
  | 'Dynamit'
  | 'Löschwasser';

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
  | 'game_over';

export type Player = {
  id: number;
  name: string;
  score: number;
  roundScore: number;
  display: DisplayItem[];
  status: 'PLAYING' | 'STOPPED' | 'BUSTED';
};

export type GameState = {
  version: 'v2_0';
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
