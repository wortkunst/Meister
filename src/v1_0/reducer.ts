import { GameState, GameAction, Card, Player, WinTier } from './types';
import { generateDeck } from './utils';

export const initialState: GameState = {
  phase: 'setup',
  nextPhase: null,
  players: [],
  deck: [],
  masterDeck: [],
  discardPile: [],
  round: 1,
  startPlayerIdx: 0,
  turnOrder: [],
  currentTurnStep: 0,
  table: {},
  masterCards: [],
  winners: [],
  winTier: null,
  penalties: [],
  penaltyAssignments: {},
  tieLogs: [],
  tieDraws: []
};

function handlePostWin(state: GameState, winnerId: number, tier: WinTier): GameState {
  const penalties: Card[] = [];
  Object.values(state.table).forEach(t => {
    if (t.phase1 && t.phase1.value < 0) penalties.push(t.phase1);
    if (t.phase3 && t.phase3.value < 0) penalties.push(t.phase3);
  });

  const newPlayers = state.players.map(p => {
    if (p.id === winnerId) {
      return { ...p, successPile: [...p.successPile, ...state.masterCards] };
    }
    return p;
  });

  if (tier === 'Bronze') {
    const finalPlayers = newPlayers.map(p => {
      if (p.id === winnerId) {
        return { ...p, successPile: [...p.successPile, ...penalties] };
      }
      return p;
    });
    return {
      ...state,
      players: finalPlayers,
      winners: [winnerId],
      winTier: tier,
      penalties: [],
      phase: 'round_end'
    };
  } else {
    if (penalties.length > 0) {
      const assignments: Record<string, number> = {};
      penalties.forEach(p => assignments[p.id] = winnerId);
      return {
        ...state,
        players: newPlayers,
        winners: [winnerId],
        winTier: tier,
        penalties,
        penaltyAssignments: assignments,
        phase: 'round_end'
      };
    } else {
      return {
        ...state,
        players: newPlayers,
        winners: [winnerId],
        winTier: tier,
        penalties: [],
        phase: 'round_end'
      };
    }
  }
}

function handleEndRound(state: GameState): GameState {
  let newDeck = [...state.deck];
  let newDiscard = [...state.discardPile];

  Object.values(state.table).forEach(t => {
    if (t.phase1 && t.phase1.value > 0) newDiscard.push(t.phase1);
    if (t.phase3 && t.phase3.value > 0) newDiscard.push(t.phase3);
  });

  const newPlayers = state.players.map(p => {
    const newHand = [...p.hand];
    while (newHand.length < 7) {
      if (newDeck.length === 0) {
        newDeck = [...newDiscard];
        for (let i = newDeck.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
        }
        newDiscard = [];
      }
      if (newDeck.length === 0) break;
      newHand.push(newDeck.pop()!);
    }
    return { ...p, hand: newHand };
  });

  if (state.masterDeck.length === 0) {
    return { ...state, phase: 'game_over', players: newPlayers };
  }

  const nextStart = (state.startPlayerIdx + 1) % state.players.length;
  const turnOrder = [];
  for (let i = 0; i < state.players.length; i++) {
    turnOrder.push((nextStart + i) % state.players.length);
  }

  return {
    ...state,
    phase: 'play_phase1',
    nextPhase: null,
    players: newPlayers,
    deck: newDeck,
    discardPile: newDiscard,
    round: state.round + 1,
    startPlayerIdx: nextStart,
    turnOrder,
    currentTurnStep: 0,
    table: Object.fromEntries(newPlayers.map(p => [p.id, { phase1: null, phase3: null, folded: false }])),
    masterCards: [],
    winners: [],
    winTier: null,
    penalties: [],
    penaltyAssignments: {},
    tieLogs: [],
    tieDraws: []
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME': {
      const deck = generateDeck();
      const masterDeck = deck.splice(0, 20);
      const players: Player[] = action.payload.playerNames.map((name, i) => ({
        id: i,
        name,
        hand: deck.splice(0, 7),
        successPile: []
      }));
      const turnOrder = players.map(p => p.id);
      const table = Object.fromEntries(players.map(p => [p.id, { phase1: null, phase3: null, folded: false }]));

      return {
        ...initialState,
        phase: 'play_phase1',
        nextPhase: null,
        players,
        deck,
        masterDeck,
        turnOrder,
        table
      };
    }
    case 'PASS_DEVICE_DONE': {
      return { ...state, phase: state.nextPhase! };
    }
    case 'PLAY_CARD': {
      const pId = state.turnOrder[state.currentTurnStep];
      const player = state.players.find(p => p.id === pId)!;
      const card = player.hand.find(c => c.id === action.payload.cardId)!;

      const newPlayers = state.players.map(p => {
        if (p.id === pId) {
          return { ...p, hand: p.hand.filter(c => c.id !== card.id) };
        }
        return p;
      });

      const newTable = {
        ...state.table,
        [pId]: {
          ...state.table[pId],
          ...(state.phase === 'play_phase1' ? { phase1: card } : { phase3: card })
        }
      };

      const nextStep = state.currentTurnStep + 1;
      if (nextStep >= state.turnOrder.length) {
        return {
          ...state,
          players: newPlayers,
          table: newTable,
          phase: state.phase === 'play_phase1' ? 'ready_to_reveal' : 'ready_to_resolve'
        };
      } else {
        return {
          ...state,
          players: newPlayers,
          table: newTable,
          currentTurnStep: nextStep,
          phase: state.phase
        };
      }
    }
    case 'PLAY_SCAPEGOAT': {
      const pId = state.turnOrder[state.currentTurnStep];
      const player = state.players.find(p => p.id === pId)!;
      const card = player.hand.find(c => c.id === action.payload.cardId)!;

      const newPlayers = state.players.map(p => {
        if (p.id === pId) {
          const newHand = p.hand.filter(c => c.id !== card.id);
          return { ...p, hand: newHand };
        }
        return p;
      });

      const newTable = {
        ...state.table,
        [pId]: {
          ...state.table[pId],
          folded: true
        }
      };

      let newDiscard = [...state.discardPile, card];
      if (state.table[pId].phase1) {
        newDiscard.push(state.table[pId].phase1!);
        newTable[pId].phase1 = null;
      }

      const nextStep = state.currentTurnStep + 1;
      if (nextStep >= state.turnOrder.length) {
        return {
          ...state,
          players: newPlayers,
          discardPile: newDiscard,
          table: newTable,
          phase: state.phase === 'play_phase1' ? 'ready_to_reveal' : 'ready_to_resolve'
        };
      } else {
        return {
          ...state,
          players: newPlayers,
          discardPile: newDiscard,
          table: newTable,
          currentTurnStep: nextStep,
          phase: state.phase
        };
      }
    }
    case 'REVEAL_MASTER': {
      const newMasterDeck = [...state.masterDeck];
      const masterCards = [newMasterDeck.pop()!, newMasterDeck.pop()!];
      const turnOrder = [...state.turnOrder].reverse().filter(id => !state.table[id].folded);
      
      return {
        ...state,
        masterDeck: newMasterDeck,
        masterCards,
        turnOrder,
        currentTurnStep: 0,
        phase: turnOrder.length > 0 ? 'play_phase3' : 'ready_to_resolve',
        nextPhase: null
      };
    }
    case 'RESOLVE_ROUND': {
      const activePlayers = state.players.filter(p => !state.table[p.id].folded);
      if (activePlayers.length === 0) {
        return { ...state, phase: 'round_end', winners: [], winTier: null };
      }

      const sums = activePlayers.map(p => {
        const c1 = state.table[p.id].phase1?.value || 0;
        const c2 = state.table[p.id].phase3?.value || 0;
        return { id: p.id, sum: c1 + c2 };
      });
      const target = state.masterCards[0].value + state.masterCards[1].value;

      let winners: number[] = [];
      let tier: WinTier = 'Bronze';

      const exactMatches = sums.filter(s => s.sum === target);
      if (exactMatches.length > 0) {
        tier = 'Gold';
        winners = exactMatches.map(s => s.id);
      } else {
        const overMatches = sums.filter(s => s.sum > target);
        if (overMatches.length > 0) {
          tier = 'Silver';
          const maxSum = Math.max(...overMatches.map(s => s.sum));
          winners = overMatches.filter(s => s.sum === maxSum).map(s => s.id);
        } else {
          tier = 'Bronze';
          const maxSum = Math.max(...sums.map(s => s.sum));
          winners = sums.filter(s => s.sum === maxSum).map(s => s.id);
        }
      }

      if (winners.length > 1) {
        return { ...state, phase: 'resolve_tie', winners, winTier: tier, tieLogs: [], tieDraws: [] };
      } else {
        return handlePostWin(state, winners[0], tier);
      }
    }
    case 'RESOLVE_TIE': {
      let currentWinners = [...state.winners];
      const logs = [...state.tieLogs];
      const allTieDraws: { playerName: string; card: Card }[][] = [];
      let loopCount = 0;
      const newPlayers = JSON.parse(JSON.stringify(state.players)) as Player[];

      while (currentWinners.length > 1 && loopCount < 5) {
        loopCount++;
        logs.push(`--- Stechen Runde ${loopCount} ---`);
        const currentRoundDraws: { playerName: string; card: Card }[] = [];
        
        const draws = currentWinners.map(pId => {
          const rightNeighborId = (pId + 1) % newPlayers.length;
          const neighbor = newPlayers.find(p => p.id === rightNeighborId)!;
          if (neighbor.hand.length === 0) return { pId, val: -999 };
          const randomIdx = Math.floor(Math.random() * neighbor.hand.length);
          const drawnCard = neighbor.hand[randomIdx];
          
          const playerName = newPlayers.find(p=>p.id===pId)?.name || 'Unbekannt';
          logs.push(`${playerName} zieht eine ${drawnCard.value} vom rechten Nachbarn.`);
          currentRoundDraws.push({ playerName, card: drawnCard });
          
          return { pId, val: drawnCard.value };
        });

        allTieDraws.push(currentRoundDraws);
        const maxVal = Math.max(...draws.map(d => d.val));
        currentWinners = draws.filter(d => d.val === maxVal).map(d => d.pId);

        if (currentWinners.length > 1) {
          logs.push(`Wieder Gleichstand mit Wert ${maxVal}!`);
        } else {
          logs.push(`${newPlayers.find(p=>p.id===currentWinners[0])?.name} gewinnt das Stechen!`);
        }
      }

      if (currentWinners.length > 1) {
         const randomWinner = currentWinners[Math.floor(Math.random() * currentWinners.length)];
         logs.push(`Immer noch Gleichstand! Das Schicksal wählt ${newPlayers.find(p=>p.id===randomWinner)?.name}.`);
         currentWinners = [randomWinner];
      }

      const newState = { ...state, winners: currentWinners, tieLogs: logs, tieDraws: allTieDraws };
      return handlePostWin(newState, currentWinners[0], state.winTier!);
    }
    case 'START_PENALTIES': {
      return {
        ...state,
        phase: 'distribute_penalties'
      };
    }
    case 'SET_PENALTY_ASSIGNMENT': {
      return {
        ...state,
        penaltyAssignments: {
          ...state.penaltyAssignments,
          [action.payload.cardId]: action.payload.playerId
        }
      };
    }
    case 'SUBMIT_PENALTIES': {
      const newPlayers = state.players.map(p => {
        let newSuccessPile = [...p.successPile];
        
        state.penalties.forEach(card => {
          if (state.penaltyAssignments[card.id] === p.id) {
            newSuccessPile.push(card);
          }
        });

        return { ...p, successPile: newSuccessPile };
      });

      return handleEndRound({ ...state, players: newPlayers });
    }
    case 'END_ROUND': {
      return handleEndRound(state);
    }
    default:
      return state;
  }
}
