import { GameState, Player, Card, GameAction, PlayerStatus } from './types';
import { generateMasterDeck, generateServantDeck } from './utils';

export const initialState: GameState = {
  phase: 'setup',
  players: [],
  masterDeck: [],
  servantDeck: [],
  discardPile: [],
  currentMasterCard: null,
  round: 1,
  startingPlayerId: 0,
  decisionQueue: [],
  currentDecisionPlayerId: null,
  tiedPlayers: null,
  roundResults: null
};

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME': {
      const players: Player[] = action.payload.playerNames.map((name, i) => ({
        id: i,
        name,
        score: 0,
        roundTotal: 0,
        status: 'ACTIVE',
        cards: [],
        decision: null
      }));
      
      let mDeck = generateMasterDeck();
      let sDeck = generateServantDeck();
      let discard: Card[] = [];
      
      const currentMasterCard = mDeck.pop()!;
      
      const newPlayers = players.map(p => {
        if (sDeck.length === 0) {
           sDeck = [...discard].sort(() => Math.random() - 0.5);
           discard = [];
        }
        const card = sDeck.pop()!;
        return {
          ...p,
          status: 'ACTIVE' as const,
          cards: [card],
          roundTotal: card.value,
          decision: null
        };
      });

      const activePlayers = newPlayers.filter(p => p.status === 'ACTIVE').map(p => p.id);
      const startingPlayerId = activePlayers[0];

      return {
        ...initialState,
        phase: activePlayers.length > 0 ? 'make_decision' : 'round_scoring',
        players: newPlayers,
        masterDeck: mDeck,
        servantDeck: sDeck,
        discardPile: discard,
        currentMasterCard,
        startingPlayerId,
        decisionQueue: activePlayers,
        currentDecisionPlayerId: activePlayers[0]
      };
    }
    
    case 'MAKE_DECISION': {
      let sDeck = [...state.servantDeck];
      let discard = [...state.discardPile];

      const newPlayers = state.players.map(p => {
        if (p.id === state.currentDecisionPlayerId) {
          if (action.payload.decision === 'WEITER') {
            if (sDeck.length === 0) {
              sDeck = [...discard].sort(() => Math.random() - 0.5);
              discard = [];
            }
            const card = sDeck.pop()!;
            
            return {
              ...p,
              decision: action.payload.decision,
              cards: [...p.cards, { ...card, hidden: true }]
            };
          } else {
            return { ...p, decision: action.payload.decision, status: 'STOPPED' as const };
          }
        }
        return p;
      });

      const newQueue = state.decisionQueue.slice(1);
      
      if (newQueue.length > 0) {
        return {
          ...state,
          players: newPlayers,
          servantDeck: sDeck,
          discardPile: discard,
          decisionQueue: newQueue,
          currentDecisionPlayerId: newQueue[0],
          phase: 'make_decision'
        };
      } else {
        return gameReducer(
          { ...state, players: newPlayers, servantDeck: sDeck, discardPile: discard },
          { type: 'REVEAL_DECISIONS' } as any
        );
      }
    }

    case 'REVEAL_DECISIONS': {
      const targetValue = state.currentMasterCard!.value;

      let newPlayers = state.players.map(p => {
        if (p.status !== 'ACTIVE') return { ...p, decision: null };

        if (p.decision === 'STOP') {
          return { ...p, status: 'STOPPED' as const, decision: null };
        }

        if (p.decision === 'WEITER') {
          const unhiddenCards = p.cards.map(c => ({ ...c, hidden: false }));
          const newTotal = unhiddenCards.reduce((sum, c) => sum + c.value, 0);
          
          let newStatus: PlayerStatus = 'ACTIVE';
          if (newTotal > targetValue) {
            newStatus = 'BUST';
          } else if (newTotal === targetValue) {
            newStatus = 'STOPPED';
          }

          return {
            ...p,
            cards: unhiddenCards,
            roundTotal: newTotal,
            status: newStatus,
            decision: null
          };
        }
        return { ...p, decision: null };
      });

      let activePlayers = newPlayers.filter(p => p.status === 'ACTIVE').map(p => p.id);
      let notBusted = newPlayers.filter(p => p.status !== 'BUST');
      
      if (activePlayers.length === 1 && notBusted.length > 1) {
        const activePlayer = newPlayers.find(p => p.id === activePlayers[0])!;
        const stoppedPlayers = newPlayers.filter(p => p.status === 'STOPPED');
        const highestStopped = Math.max(...stoppedPlayers.map(p => p.roundTotal), -1);
        
        if (activePlayer.roundTotal > highestStopped) {
          newPlayers = newPlayers.map(p => 
            p.id === activePlayer.id 
              ? { ...p, status: 'STOPPED' as const } 
              : p
          );
          activePlayers = [];
          notBusted = newPlayers.filter(p => p.status !== 'BUST');
        }
      }

      const sortedActivePlayers = [
        ...activePlayers.filter(id => id >= state.startingPlayerId),
        ...activePlayers.filter(id => id < state.startingPlayerId)
      ];
      
      const nextState = {
        ...state,
        players: newPlayers,
      };

      if (activePlayers.length > 0 && notBusted.length > 1) {
        return {
          ...nextState,
          decisionQueue: sortedActivePlayers,
          currentDecisionPlayerId: sortedActivePlayers[0],
          phase: 'make_decision'
        };
      } else {
        let tiedPlayers: Player[] = [];
        if (notBusted.length > 0) {
          const bestValue = Math.max(...notBusted.map(p => p.roundTotal));
          tiedPlayers = notBusted.filter(p => p.roundTotal === bestValue);
        }
        
        if (tiedPlayers.length > 1) {
          return {
            ...nextState,
            phase: 'resolve_tie',
            tiedPlayers: tiedPlayers.map(p => p.id)
          };
        }

        return gameReducer(nextState, { type: 'SCORE_ROUND' } as any);
      }
    }

    case 'UBEREIFRIG': {
      if (!state.tiedPlayers) return state;
      
      let sDeck = [...state.servantDeck];
      let discard = [...state.discardPile];
      const targetValue = state.currentMasterCard!.value;

      const newPlayers = state.players.map(p => {
        if (state.tiedPlayers!.includes(p.id)) {
          if (sDeck.length === 0) {
            sDeck = [...discard].sort(() => Math.random() - 0.5);
            discard = [];
          }
          const card = sDeck.pop()!;
          const newTotal = p.roundTotal + card.value;
          
          let newStatus: PlayerStatus = 'STOPPED';
          if (newTotal > targetValue) {
            newStatus = 'BUST';
          }

          return {
            ...p,
            cards: [...p.cards, { ...card, hidden: false }],
            roundTotal: newTotal,
            status: newStatus
          };
        }
        return p;
      });

      const nextState = {
        ...state,
        players: newPlayers,
        servantDeck: sDeck,
        discardPile: discard,
        tiedPlayers: null
      };
      
      return gameReducer(nextState, { type: 'SCORE_ROUND' } as any);
    }

    case 'SCORE_ROUND': {
      const targetValue = state.currentMasterCard!.value;
      const notBusted = state.players.filter(p => p.status !== 'BUST');
      
      let bestValue = -1;
      if (notBusted.length > 0) {
        bestValue = Math.max(...notBusted.map(p => p.roundTotal));
      }

      const roundResults = state.players.map(p => {
        let scoreDelta = 0;

        if (notBusted.length > 0) {
          if (p.status !== 'BUST') {
            if (p.roundTotal === targetValue) {
              scoreDelta = 3;
            } else if (p.roundTotal === bestValue) {
              scoreDelta = 0;
            } else {
              scoreDelta = -(targetValue - p.roundTotal);
            }
          } else {
            scoreDelta = -(p.roundTotal - targetValue);
          }
        } else {
          scoreDelta = -(p.roundTotal - targetValue);
        }

        return {
          playerId: p.id,
          scoreDelta
        };
      });

      const newPlayers = state.players.map(p => {
        const res = roundResults.find(r => r.playerId === p.id)!;
        return { ...p, score: Math.min(0, p.score + res.scoreDelta) };
      });

      const isGameOver = newPlayers.some(p => p.score <= -20);

      return {
        ...state,
        players: newPlayers,
        roundResults,
        phase: isGameOver ? 'game_over' : 'round_scoring'
      };
    }

    case 'START_NEXT_ROUND': {
      let mDeck = [...state.masterDeck];
      if (mDeck.length === 0) mDeck = generateMasterDeck();
      const currentMasterCard = mDeck.pop()!;

      let sDeck = [...state.servantDeck];
      let discard = [...state.discardPile];
      
      state.players.forEach(p => {
        discard.push(...p.cards);
      });

      const newPlayers = state.players.map(p => {
        if (sDeck.length === 0) {
           sDeck = [...discard].sort(() => Math.random() - 0.5);
           discard = [];
        }
        const card = sDeck.pop()!;
        return {
          ...p,
          status: 'ACTIVE' as const,
          cards: [card],
          roundTotal: card.value,
          decision: null
        };
      });

      const nextStartingPlayerIndex = (state.players.findIndex(p => p.id === state.startingPlayerId) + 1) % state.players.length;
      const startingPlayerId = state.players[nextStartingPlayerIndex].id;

      const activePlayers = newPlayers.map(p => p.id);
      const sortedActivePlayers = [
        ...activePlayers.filter(id => id >= startingPlayerId),
        ...activePlayers.filter(id => id < startingPlayerId)
      ];

      return {
        ...state,
        phase: 'make_decision',
        players: newPlayers,
        masterDeck: mDeck,
        servantDeck: sDeck,
        discardPile: discard,
        currentMasterCard,
        startingPlayerId,
        decisionQueue: sortedActivePlayers,
        currentDecisionPlayerId: sortedActivePlayers[0],
        round: state.round + 1,
        roundResults: null
      };
    }

    default:
      return state;
  }
}
