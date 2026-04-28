import { GameState, Card, Player, DisplayItem, GamePhase } from './types';
import { generateDeck } from './utils';

export const initialState: GameState = {
  version: 'v2_0',
  players: [],
  currentPlayerIndex: 0,
  deck: [],
  discardPile: [],
  phase: 'setup',
  round: 0,
  pendingCards: [],
  eventLog: []
};

function getTopCard(state: GameState): { card: Card, newState: GameState } {
  let deck = [...state.deck];
  let discard = [...state.discardPile];
  let newLog = [...state.eventLog];
  if (deck.length === 0) {
      deck = [...discard].sort(() => Math.random() - 0.5);
      discard = [];
      newLog.push({ id: Math.random().toString(), msg: 'Ablagestapel wurde neu gemischt.' });
  }
  const card = deck.shift()!;
  return {
      card,
      newState: { ...state, deck, discardPile: discard, eventLog: newLog }
  };
}

function logEvent(state: GameState, msg: string): GameState {
  return { ...state, eventLog: [...state.eventLog, { id: Math.random().toString(), msg }] };
}

function hasValidCageTargets(state: GameState): boolean {
  const p = state.players[state.currentPlayerIndex];
  return p.display.some(i => !i.cagedBy && (i.isSecret || i.card.type !== 'Käfig'));
}

function causesBust(state: GameState, p: Player, card: Card): boolean {
  // Dynamit is handled separately with the chain mechanic
  if (card.type === 'Dynamit') return false;

  if (card.type === 'Des Meisters Fluch') return false;
  
  const baseTypes = p.display.filter(i => !i.cagedBy && !i.isSecret && !i.isBusted).map(i => i.card.type);
  const cageTypes = p.display.filter(i => i.cagedBy && !i.isBusted).map(i => i.cagedBy!.type); // These are the Käfig cards
  const activeTypes = [...baseTypes, ...cageTypes];
  
  if (activeTypes.includes(card.type)) {
    return true;
  }
  
  return false;
}

function advanceTurn(state: GameState): GameState {
  let ns = { ...state };
  ns.phase = 'playing'; // default fallback
  
  const activeCount = ns.players.filter(p => p.status === 'PLAYING').length;
  if (activeCount === 0) {
      ns = logEvent(ns, `Alle Spieler sind fertig. Die Wertereihe beginnt...`);
      return scoreRound(ns);
  }

  let currIdx = ns.currentPlayerIndex;
  for (let i = 1; i <= ns.players.length; i++) {
     let testIdx = (currIdx + i) % ns.players.length;
     if (ns.players[testIdx].status === 'PLAYING') {
         ns.currentPlayerIndex = testIdx;
         break;
     }
  }

  const nextP = ns.players[ns.currentPlayerIndex];
  // ns = logEvent(ns, `Spielerwechsel: ${nextP.name} ist am Zug.`); // Commented out to reduce spam, the UI shows who's turn it is.
  return ns;
}

function handleBust(state: GameState, card: Card): GameState {
  let newState = { ...state };
  let newPlayer = { ...newState.players[newState.currentPlayerIndex] };

  // Add the card normally so it flies in, but ONLY if it's not already there
  // (In the dynamite chain case, the card is already in the display)
  const isAlreadyInDisplay = newPlayer.display.some(i => i.card.id === card.id);
  if (!isAlreadyInDisplay) {
    const bustedItem: DisplayItem = { id: `busted-${card.id}`, card };
    newPlayer.display = [...newPlayer.display, bustedItem];
  }
  
  const armorIndex = newPlayer.display.findIndex(i => !i.cagedBy && !i.isSecret && i.card.type === 'Schrottrüstung');
  
  if (armorIndex !== -1) {
    const keptItems = newPlayer.display.slice(0, armorIndex).map(i => ({ ...i, isEvaluated: true }));
    const lostItems = newPlayer.display.slice(armorIndex);
    newPlayer.display = [...keptItems, ...lostItems];
    newState.phase = 'bust_armor_wait' as any;
    newState = logEvent(newState, `${newPlayer.name} zieht ${card.type} und bustet! Schrottrüstung rettet einen Teil...`);
  } else {
    newState.phase = 'bust_wait' as any;
    newState = logEvent(newState, `${newPlayer.name} zieht ${card.type} und wird gleich busten!`);
  }
  
  newState.players = newState.players.map(pl => pl.id === newPlayer.id ? newPlayer : pl);

  return newState;
}

function applyFluchCancel(state: GameState, card: Card): GameState {
  const p = state.players[state.currentPlayerIndex];
  const newItem: DisplayItem = {
     id: Math.random().toString(),
     card
  };
  
  let newDisplay = [...p.display, newItem];
  let newPlayer = { ...p, display: newDisplay };
  
  let newState = { ...state };
  newState.players = newState.players.map(pl => pl.id === p.id ? newPlayer : pl);
  newState = logEvent(newState, `${p.name} zieht einen zweiten Fluch. Beide verflüchtigen sich!`);
  
  return { ...newState, phase: 'fluch_cancel_wait' as any };
}

function addToDisplay(state: GameState, card: Card, opts?: { isSecret?: boolean }): GameState {
  const p = state.players[state.currentPlayerIndex];
  const newItem: DisplayItem = {
     id: Math.random().toString(),
     card,
     isSecret: opts?.isSecret
  };
  const newPlayer = { ...p, display: [...p.display, newItem] };
  return {
    ...state,
    players: state.players.map(pl => pl.id === p.id ? newPlayer : pl)
  };
}

export function playCard(state: GameState, card: Card): GameState {
  const p = state.players[state.currentPlayerIndex];
  let s = logEvent(state, `${p.name} zieht und spielt: ${card.type}`);

  // --- Dynamit chain mechanic ---
  if (card.type === 'Dynamit') {
    if (s.firstDynamitePlayerId === undefined) {
      // First Dynamit: just mark this player and continue normally
      let s2 = addToDisplay(s, card);
      s2 = logEvent(s2, `${p.name} hält jetzt das erste Dynamit – Vorsicht!`);
      s2 = { ...s2, firstDynamitePlayerId: p.id };
      return advanceTurn(s2);
    } else {
      // Second Dynamit: bust the player who holds the first one
      const firstPlayer = s.players.find(pl => pl.id === s.firstDynamitePlayerId)!;
      s = logEvent(s, `${p.name} zieht das zweite Dynamit – ${firstPlayer.name} fliegt in die Luft!`);

      // Add the new dynamit card to current player's display first
      let s2 = addToDisplay(s, card);

      // The new dynamit becomes the "first" dynamit – owned by current player
      s2 = { ...s2, firstDynamitePlayerId: p.id };

      // Now trigger bust for the firstDynamitePlayer
      // We temporarily switch currentPlayerIndex to that player to reuse handleBust
      const savedIndex = s2.currentPlayerIndex;
      const bustTargetIndex = s2.players.findIndex(pl => pl.id === firstPlayer.id);
      s2 = { ...s2, currentPlayerIndex: bustTargetIndex };
      s2 = handleBust(s2, firstPlayer.display.find(i => i.card.type === 'Dynamit')?.card ?? card);
      // Restore the current player index so the UI / advanceTurn knows whose turn it is after cleanup
      s2 = { ...s2, currentPlayerIndex: bustTargetIndex };
      return s2;
    }
  }
  // --- End Dynamit logic ---

  if (causesBust(s, p, card)) {
    return handleBust(s, card);
  }

  if (card.type === 'Des Meisters Fluch') {
     const hasUncagedFluch = p.display.some(i => !i.cagedBy && !i.isSecret && i.card.type === 'Des Meisters Fluch');
     if (hasUncagedFluch) {
         return applyFluchCancel(s, card);
     }
  }

  if (card.type === 'Käfig') {
      if (hasValidCageTargets(s)) {
          return { ...s, phase: 'cage_decision', pendingActionCard: card };
      }
      let s2 = addToDisplay(s, card);
      return advanceTurn(s2);
  }

  if (card.type === 'Hinterhalt!') {
      let s2 = addToDisplay(s, card);
      const activeOpponents = s2.players.filter(pl => pl.id !== p.id && pl.status === 'PLAYING');
      const opponentsHaveCards = activeOpponents.some(pl => pl.display.length > 0);

      // Now we can target anyone who is playing (including ourselves)
      // The Hinterhalt card itself (the one currently being evaluated) isn't a valid target,
      // but ANY OTHER card (including other Hinterhalt cards) is a valid target.
      const anyValidTargets = s2.players.some(pl => 
         pl.status === 'PLAYING' && pl.display.some(item => item.card.id !== card.id)
      );

      if (anyValidTargets) {
         return { ...s2, phase: 'hinterhalt_decision', pendingActionCard: card };
      } else {
         s2 = logEvent(s2, `Hinterhalt! findet kein passendes Ziel.`);
         return advanceTurn(s2);
      }
  }

  if (card.type === 'Lugloch') {
      let s2 = addToDisplay(s, card);
      s2 = logEvent(s2, `${p.name} spielt ein Lugloch – beim nächsten Zug darf er einen Blick riskieren!`);
      return advanceTurn(s2);
  }

  let nextState = addToDisplay(s, card);

  if (card.type === 'Geheimfach') {
      let s2 = addToDisplay(s, card);
      s2 = logEvent(s2, `${p.name} spielt ein Geheimfach – beim nächsten Zug darf er eine Geheimkarte ziehen!`);
      return advanceTurn(s2);
  }

  if (card.type === 'Von hinten geschubst') {
      return { ...nextState, phase: 'geschubst_decision' };
  }

  return advanceTurn(nextState);
}

function scoreRound(state: GameState): GameState {
   let newPlayers = state.players.map(p => {
       let roundPoints = 0;
       
       let revealedDisplay = p.display.map(i => {
           if (i.isSecret) {
               return { ...i, isSecret: false };
           }
           return i;
       });

       let newP = { ...p }; // Deep copy so we don't mutate the state reference on multiple renders

       if (newP.status === 'STOPPED') {
           revealedDisplay.forEach(i => {
               if (!i.isBusted) {
                   roundPoints += i.card.value;
                   if (i.cagedBy) roundPoints += i.cagedBy.value;
               }
           });
           newP.roundScore = roundPoints;
           newP.score = Math.max(0, newP.score + roundPoints);
       } else {
           newP.roundScore = 0; // Busted entirely
       }
       return { ...newP, display: revealedDisplay };
   });

   const nextRoundStartsAt = (state.round) % state.players.length; 
   let isGameOver = newPlayers.some(p => p.score >= 50);

   return {
       ...state,
       players: newPlayers,
       phase: isGameOver ? 'game_over' : 'round_end'
   };
}

function startRound(state: GameState): GameState {
   const newStart = (state.round) % state.players.length; 
   
   // Collect all cards from players' displays into the discard pile
   let returnedCards: Card[] = [];
   state.players.forEach(p => {
       p.display.forEach(item => {
           returnedCards.push(item.card);
           if (item.cagedBy) returnedCards.push(item.cagedBy);
       });
   });

   let newPlayers = state.players.map(p => ({
       ...p,
       status: 'PLAYING' as const,
       display: [],
       roundScore: 0
   }));

   let newDeck = [...state.deck];
   let newDiscard = [...state.discardPile, ...returnedCards];

   // If the deck is empty, reshuffle the discard pile
   if (newDeck.length === 0) {
       newDeck = newDiscard.sort(() => Math.random() - 0.5);
       newDiscard = [];
   }

   let ns: GameState = {
       ...state,
       deck: newDeck,
       discardPile: newDiscard,
       players: newPlayers as Player[],
       round: state.round + 1,
       currentPlayerIndex: newStart,
       phase: 'playing' as GamePhase,
       firstDynamitePlayerId: undefined,
       eventLog: [] // Clear log per round
   };

   ns = logEvent(ns, `--- RUNDE ${ns.round} STARTET ---`);
   ns = logEvent(ns, `${ns.players[newStart].name} beginnt die Runde.`);

   return ns;
}

export type GameAction = 
  | { type: 'START_GAME'; payload: { playerNames: string[] } }
  | { type: 'DRAW_CARD' }
  | { type: 'STOP' }
  | { type: 'CAGE_TARGET'; payload: { targetId: string } }
  | { type: 'HINTERHALT_TARGET'; payload: { targetPlayerId: number, targetId: string, isCageTarget?: boolean } }
  | { type: 'LUGLOCH_PLAY' }
  | { type: 'LUGLOCH_RETURN' }
  | { type: 'ELIXIR_CHOOSE'; payload: { index: number } }
  | { type: 'DRAW_SECRET_CARD' }
  | { type: 'TRIGGER_FLUCH_ANIM' }
  | { type: 'CLEANUP_FLUCH' }
  | { type: 'TRIGGER_BUST' }
  | { type: 'TRIGGER_BUST_COUNTDOWN' }
  | { type: 'CLEANUP_BUST' }
  | { type: 'CLEANUP_HINTERHALT' }
  | { type: 'START_NEXT_ROUND' };

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME': {
      const players: Player[] = action.payload.playerNames.map((name, idx) => ({
        id: idx,
        name,
        score: 0,
        roundScore: 0,
        display: [],
        status: 'PLAYING',
      }));
      let ns = {
        ...initialState,
        players,
        deck: generateDeck(),
        round: 1,
        currentPlayerIndex: 0,
        phase: 'playing' as GamePhase
      };
      ns.players[0].status = 'PLAYING';
      return ns;
    }

    case 'DRAW_CARD': {
        const p = state.players[state.currentPlayerIndex];

        // Check for unused Lugloch or Geheimfach (triggers at start of next turn)
        if (p.display.length > 0 && state.phase === 'playing') {
            const rightmost = p.display[p.display.length - 1];
            
            if (rightmost.card.type === 'Lugloch' && !rightmost.cagedBy && !rightmost.isSecret && !rightmost.luglochUsed) {
                // Mark the lugloch as used
                const newDisplay = p.display.map((i, idx) => idx === p.display.length - 1 ? { ...i, luglochUsed: true } : i);
                const newPlayer = { ...p, display: newDisplay };
                let ns = {
                    ...state,
                    players: state.players.map(pl => pl.id === p.id ? newPlayer : pl),
                    phase: 'lugloch_decision' as GamePhase
                };
                const { card: nextCard, newState: s1 } = getTopCard(ns);
                s1.pendingCards = [nextCard];
                return logEvent(s1, `${p.name} nutzt sein Lugloch und schaut die nächste Karte an...`);
            }

            if (rightmost.card.type === 'Geheimfach' && !rightmost.cagedBy && !rightmost.isSecret && !rightmost.geheimfachUsed) {
                // Mark as used and trigger secret card draw
                const newDisplay = p.display.map((i, idx) => idx === p.display.length - 1 ? { ...i, geheimfachUsed: true } : i);
                const newPlayer = { ...p, display: newDisplay };
                let ns = {
                    ...state,
                    players: state.players.map(pl => pl.id === p.id ? newPlayer : pl)
                };
                // We directly call the draw secret logic (simplified version of DRAW_SECRET_CARD action)
                const { card: secretCard, newState: s1 } = getTopCard(ns);
                let finalS = addToDisplay(s1, secretCard, { isSecret: true });
                finalS = logEvent(finalS, `${p.name} nutzt sein Geheimfach und zieht eine Karte verdeckt.`);
                return advanceTurn(finalS);
            }
        }

        // Check for Elixir
        if (p.display.length > 0 && state.phase === 'playing') {
           const rightmost = p.display[p.display.length - 1];
           if (rightmost.card.type === 'Auswahlelixir' && !rightmost.cagedBy && !rightmost.isSecret && !rightmost.elixirUsed) {
               // Trigger Elixir!
               const newDisplay = p.display.map((i, idx) => idx === p.display.length - 1 ? { ...i, elixirUsed: true } : i);
               const newPlayer = { ...p, display: newDisplay };
               let ns = { 
                  ...state, 
                  players: state.players.map(pl => pl.id === p.id ? newPlayer : pl),
                  phase: 'elixir_decision' as GamePhase
               };
               const { card: c1, newState: s1 } = getTopCard(ns);
               const { card: c2, newState: s2 } = getTopCard(s1);
               let finalState = s2;
               finalState.pendingCards = [c1, c2];
               finalState = logEvent(finalState, `${p.name} nutzt sein Auswahlelixir und zieht 2 Karten!`);
               return finalState;
           }
        }
        
        const { card, newState } = getTopCard(state);
        let s = newState;
        if (s.phase === 'geschubst_decision') {
            s = { ...s, phase: 'playing' };
        }
        return playCard(s, card);
    }

    case 'STOP': {
        const p = state.players[state.currentPlayerIndex];
        const newPlayers = state.players.map(pl => pl.id === p.id ? { ...pl, status: 'STOPPED' as const } : pl);
        let ns = { ...state, players: newPlayers };
        ns = logEvent(ns, `${p.name} sagt "Hör auf!" und beendet seinen Zug.`);
        return advanceTurn(ns);
    }

    case 'CAGE_TARGET': {
        const targetId = action.payload.targetId;
        const p = state.players[state.currentPlayerIndex];
        const targetItem = p.display.find(i => i.id === targetId)!;
        const newDisplay = p.display.map(i => i.id === targetId ? { ...i, cagedBy: state.pendingActionCard } : i);
        const newPlayer = { ...p, display: newDisplay };
        let ns: GameState = { 
           ...state, 
           players: state.players.map(pl => pl.id === p.id ? newPlayer : pl), 
           pendingActionCard: undefined 
        };
        // If the caged card is the active Dynamit, remove the icon
        if (targetItem.card.type === 'Dynamit' && ns.firstDynamitePlayerId === p.id) {
            ns = { ...ns, firstDynamitePlayerId: undefined };
        }
        ns = logEvent(ns, `${p.name} sperrt eine Karte in den Käfig.`);
        return advanceTurn(ns);
    }

    case 'LUGLOCH_PLAY': {
        const cardToPlay = state.pendingCards[0];
        let ns = { ...state, pendingCards: [] };
        ns = logEvent(ns, `Lugloch: Die gesehene Karte wird gespielt!`);
        return playCard(ns, cardToPlay);
    }

    case 'LUGLOCH_RETURN': {
        const cardToReturn = state.pendingCards[0];
        const newDeck = [cardToReturn, ...state.deck];
        let ns = { ...state, deck: newDeck, pendingCards: [] };
        ns = logEvent(ns, `Lugloch: Die gesehene Karte wurde verdeckt zurückgelegt.`);
        return advanceTurn(ns);
    }

    case 'ELIXIR_CHOOSE': {
        const chosenIdx = action.payload.index;
        const chosenCard = state.pendingCards[chosenIdx];
        const discardedCard = state.pendingCards[1 - chosenIdx];
        let ns = { 
           ...state, 
           pendingCards: [], 
           discardPile: [...state.discardPile, discardedCard]
        };
        ns = logEvent(ns, `Auswahlelixir: Eine Karte wurde gewählt.`);
        return playCard(ns, chosenCard);
    }

    case 'DRAW_SECRET_CARD': {
        let ns = { ...state };
        const { card: secretCard, newState: s1 } = getTopCard(ns);
        ns = addToDisplay(s1, secretCard, { isSecret: true });
        ns = logEvent(ns, `${state.players[state.currentPlayerIndex].name} zieht den Geheimfach-Inhalt verdeckt.`);
        return advanceTurn(ns);
    }

    case 'HINTERHALT_TARGET': {
        const { targetPlayerId, targetId, isCageTarget } = action.payload as { targetPlayerId: number, targetId: string, isCageTarget?: boolean };
        const targetPlayer = state.players.find(pl => pl.id === targetPlayerId)!;
        const targetItem = targetPlayer.display.find(i => i.id === targetId)!;
        
        let newDisplay;
        let discardedCard;
        let didBust = false;
        let ns = state;
        let newFirstDynamitePlayerId = ns.firstDynamitePlayerId;
        
        if (isCageTarget && targetItem.cagedBy) {
            // Set flag on the item that HAD the cage, but remove the cage itself from the state
            // so it's "freed", but we keep the reference for the animation in the UI.
            newDisplay = targetPlayer.display.map(i => i.id === targetId ? { ...i, cagedBy: undefined, destroyedCageCard: targetItem.cagedBy, isCageDestroying: true } : i);
            discardedCard = targetItem.cagedBy;
            
            // Re-evaluate if this causes a bust for the target player
            const newlyUncoveredType = targetItem.card.type;
            const activeOfThisType = newDisplay.filter(i => !i.cagedBy && !i.isSecret && !i.isBusted && !i.isCageDestroying && i.card.type === newlyUncoveredType).length;
            
            if (activeOfThisType > 1) {
                didBust = true;
                const armorIndex = newDisplay.findIndex(i => !i.cagedBy && !i.isSecret && !i.isBusted && !i.isCageDestroying && i.card.type === 'Schrottrüstung');
                if (armorIndex !== -1) {
                    const keptItems = newDisplay.slice(0, armorIndex);
                    const lostItems = newDisplay.slice(armorIndex).map(i => i.isCageDestroying ? i : { ...i, isBusted: true });
                    newDisplay = [...keptItems, ...lostItems];
                    ns = logEvent(ns, `Kettenreaktion! ${targetPlayer.name} hat nun zweimal ${newlyUncoveredType} und bustet! Rüstung rettet einen Teil.`);
                } else {
                    newDisplay = newDisplay.map(i => i.isCageDestroying ? i : { ...i, isBusted: true });
                    ns = logEvent(ns, `Fataaal! ${targetPlayer.name} hat nun zweimal ${newlyUncoveredType} und BUSTET komplett!`);
                }
            }

            // --- Dynamit cage-bust logic ---
            // If the uncaged card is a Dynamit, it becomes active again
            if (targetItem.card.type === 'Dynamit') {
                if (newFirstDynamitePlayerId === undefined) {
                    // No active first dynamit – this uncaged Dynamit is now the first
                    newFirstDynamitePlayerId = targetPlayerId;
                    ns = logEvent(ns, `Das befreite Dynamit bei ${targetPlayer.name} ist jetzt das erste Dynamit!`);
                } else if (newFirstDynamitePlayerId !== targetPlayerId) {
                    // There is already a first dynamit owner – they bust now
                    const firstDynamitPlayer = ns.players.find(pl => pl.id === newFirstDynamitePlayerId)!;
                    ns = logEvent(ns, `Das befreite Dynamit zündet! ${firstDynamitPlayer.name} fliegt in die Luft!`);
                    // Trigger bust for the firstDynamitePlayer
                    const bustTargetIndex = ns.players.findIndex(pl => pl.id === newFirstDynamitePlayerId);
                    const savedIndex = ns.currentPlayerIndex;
                    ns = { ...ns, currentPlayerIndex: bustTargetIndex };
                    ns = handleBust(ns, firstDynamitPlayer.display.find(i => i.card.type === 'Dynamit')?.card ?? targetItem.card);
                    ns = { ...ns, currentPlayerIndex: bustTargetIndex };
                    // The uncaged Dynamit becomes the new first
                    newFirstDynamitePlayerId = targetPlayerId;
                }
                // If newFirstDynamitePlayerId === targetPlayerId, the same player re-activates
                // their own dynamit (edge case: caged their own dynamit and cage was destroyed)
                // – just keep their icon
            }
            // --- End Dynamit cage logic ---

        } else {
            // Mark the card as destroyed instead of removing it
            newDisplay = targetPlayer.display.map(i => i.id === targetId ? { ...i, isHinterhaltDestroyed: true } : i);
            discardedCard = targetItem.card;

            // --- Dynamit direct removal logic ---
            if (targetItem.card.type === 'Dynamit' && newFirstDynamitePlayerId === targetPlayerId) {
                newFirstDynamitePlayerId = undefined;
            }
            // --- End Dynamit removal logic ---
        }
        
        let finalPlayerInfo = { ...targetPlayer, display: newDisplay, status: targetPlayer.status };
        if (didBust) {
            const hasArmor = targetPlayer.display.findIndex(i => !i.cagedBy && !i.isSecret && !i.isBusted && i.card.type === 'Schrotrüstung') !== -1;
            finalPlayerInfo.status = hasArmor ? 'STOPPED' : 'BUSTED';
        }

        ns = {
           ...ns,
           discardPile: [...ns.discardPile, discardedCard],
           players: ns.players.map(pl => pl.id === targetPlayerId ? finalPlayerInfo : pl),
           pendingActionCard: undefined,
           phase: 'hinterhalt_anim' as GamePhase,
           firstDynamitePlayerId: newFirstDynamitePlayerId
        };
        
        ns = logEvent(ns, `${state.players[state.currentPlayerIndex].name} wirft ${discardedCard.type} von ${targetPlayer.name} ab!`);
        return ns;
    }

    case 'CLEANUP_HINTERHALT': {
        // Remove all hinterhalt-destroyed items and clear animation flags
        let ns = { ...state };
        ns.players = ns.players.map(p => ({
            ...p,
            display: p.display
                .filter(i => !i.isHinterhaltDestroyed)
                .map(i => ({ ...i, isCageDestroying: false, destroyedCageCard: undefined }))
        }));
        return advanceTurn(ns);
    }

    case 'TRIGGER_BUST_COUNTDOWN': {
       return { ...state, phase: 'bust_wait' as GamePhase };
    }

    case 'TRIGGER_BUST': {
       let ns = { ...state };
       let p = { ...ns.players[ns.currentPlayerIndex] };
       
       const armorIndex = p.display.findIndex(i => !i.cagedBy && !i.isSecret && i.card.type === 'Schrottrüstung');
       
       if (armorIndex !== -1) {
          const keptItems = p.display.slice(0, armorIndex);
          const lostItems = p.display.slice(armorIndex).map(i => ({ ...i, isBusted: true }));
          p.display = [...keptItems, ...lostItems];
          p.status = 'STOPPED';
          ns.players = ns.players.map(pl => pl.id === p.id ? p : pl);
          ns.phase = 'bust_anim' as GamePhase;
          ns = logEvent(ns, `BUMM! Der Rest fliegt in die Luft.`);
       } else {
          p.display = p.display.map(i => ({ ...i, isBusted: true }));
          p.status = 'BUSTED';
          ns.players = ns.players.map(pl => pl.id === p.id ? p : pl);
          ns.phase = 'bust_anim' as GamePhase;
          ns = logEvent(ns, `BUMM! Komplett gebustet!`);
       }

       return ns;
    }

    case 'CLEANUP_BUST': {
       return advanceTurn(state);
    }

    case 'TRIGGER_FLUCH_ANIM': {
        const p = state.players[state.currentPlayerIndex];
        const existingFluchIdx = p.display.findIndex(i => !i.cagedBy && !i.isSecret && i.card.type === 'Des Meisters Fluch');
        const secondFluchIdx = p.display.findLastIndex(i => !i.cagedBy && !i.isSecret && i.card.type === 'Des Meisters Fluch');
        
        let newDisplay = [...p.display];
        if (existingFluchIdx !== -1) newDisplay[existingFluchIdx] = { ...newDisplay[existingFluchIdx], isFluchCanceled: true };
        if (secondFluchIdx !== -1) newDisplay[secondFluchIdx] = { ...newDisplay[secondFluchIdx], isFluchCanceled: true };
        
        let newPlayer = { ...p, display: newDisplay };
        let ns = { 
           ...state, 
           players: state.players.map(pl => pl.id === p.id ? newPlayer : pl),
           phase: 'fluch_cancel_anim' as GamePhase
        };
        return ns;
    }

    case 'CLEANUP_FLUCH': {
        const p = state.players[state.currentPlayerIndex];
        const canceledItems = p.display.filter(i => i.isFluchCanceled);
        const newDisplay = p.display.filter(i => !i.isFluchCanceled);
        
        let newPlayer = { ...p, display: newDisplay };
        let ns = { 
           ...state, 
           players: state.players.map(pl => pl.id === p.id ? newPlayer : pl),
           discardPile: [...state.discardPile, ...canceledItems.map(i => i.card)]
        };
        return advanceTurn(ns);
    }

    case 'START_NEXT_ROUND': {
        return startRound(state);
    }

    default:
      return state;
  }
}
