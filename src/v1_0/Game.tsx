import React, { useReducer, useState } from 'react';
import { gameReducer, initialState } from './reducer';
import { Card, Player } from './types';
import { calculateScore } from './utils';
import { Skull, Heart, Crown, ArrowRight, ShieldAlert, EyeOff } from 'lucide-react';

function PlayingCard({ card, onClick, selected, disabled }: { card: Card, onClick?: () => void, selected?: boolean, disabled?: boolean, key?: React.Key }) {
  const isEvil = card.type === 'evil';
  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={`relative w-20 h-32 sm:w-24 sm:h-36 rounded-xl border-2 flex flex-col items-center justify-center transition-transform select-none
        ${isEvil ? 'bg-red-950 border-red-500 text-red-100' : 'bg-slate-100 border-slate-400 text-slate-900'}
        ${selected ? 'ring-4 ring-yellow-400 scale-105 z-10' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}
      `}
    >
      <span className="text-[9px] sm:text-[11px] font-bold text-center px-1 leading-tight mb-1">{card.name}</span>
      <span className="text-2xl sm:text-3xl font-bold">{card.value > 0 ? `+${card.value}` : card.value}</span>
      <span className="text-[10px] sm:text-xs uppercase mt-2 opacity-70 flex items-center gap-1">
        {isEvil ? <Skull size={12} /> : <Heart size={12} />}
      </span>
    </div>
  );
}

function CardBack() {
  return (
    <div className="relative w-20 h-32 sm:w-24 sm:h-36 rounded-xl border-2 border-slate-700 bg-slate-800 flex items-center justify-center">
      <div className="w-16 h-24 border border-slate-600 rounded-lg opacity-50 flex items-center justify-center">
        <ShieldAlert size={24} className="text-slate-600" />
      </div>
    </div>
  );
}

function BlindCard() {
  return (
    <div className="relative w-20 h-32 sm:w-24 sm:h-36 rounded-xl border-2 border-slate-700 bg-slate-800 flex items-center justify-center">
      <div className="w-16 h-24 border border-slate-600 rounded-lg opacity-50 flex flex-col items-center justify-center gap-2">
        <EyeOff size={24} className="text-slate-500" />
        <span className="text-[10px] font-bold text-slate-500 tracking-widest">BLIND</span>
      </div>
    </div>
  );
}

export default function Game({ 
  currentVersion, 
  onSwitchVersion,
  initialPlayers
}: { 
  currentVersion: string, 
  onSwitchVersion: (v: string, players?: string[] | null) => void,
  initialPlayers?: string[] | null
}) {
  const initGameState = (init: typeof initialState) => {
    if (initialPlayers && initialPlayers.length >= 2) {
      return gameReducer(init, { type: 'START_GAME', payload: { playerNames: initialPlayers } });
    }
    return init;
  };

  const [state, dispatch] = useReducer(gameReducer, initialState, initGameState);
  
  const defaultNames = initialPlayers && initialPlayers.length >= 2 
    ? [...initialPlayers, ...Array(4 - initialPlayers.length).fill('')].slice(0, 4)
    : ['Gnogin', 'Spipz', 'Borkle', ''];
  const [playerNames, setPlayerNames] = useState(defaultNames);
  const [scapegoatMode, setScapegoatMode] = useState(false);

  const handleSwitchVersion = (v: string) => {
    const currentActivePlayers = state.phase === 'setup' 
      ? playerNames.filter(n => n.trim() !== '')
      : state.players.map(p => p.name);
    onSwitchVersion(v, currentActivePlayers);
  };

  const handleStartVersion = (v: string) => {
    const names = playerNames.filter(n => n.trim() !== '');
    if (names.length >= 2) {
      if (v === currentVersion) {
        dispatch({ type: 'START_GAME', payload: { playerNames: names } });
      } else {
        onSwitchVersion(v, names);
      }
    }
  };

  const currentPlayerId = state.turnOrder[state.currentTurnStep];
  const currentPlayer = state.players.find(p => p.id === currentPlayerId);


  const renderVersionDropdown = () => {
    if (state.phase === 'setup') return null;
    return (
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        <button
          onClick={() => window.location.reload()}
          className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 rounded px-2 py-1 text-xs outline-none focus:border-slate-400 font-medium transition-colors"
        >
          Neustart
        </button>
        <select 
          value={currentVersion} 
          onChange={(e) => handleSwitchVersion(e.target.value)}
          className="cursor-pointer bg-slate-800 text-slate-300 border border-slate-600 rounded px-2 py-1 text-xs outline-none focus:border-slate-400"
        >
          <option value="v3_0">V 2.0 Captain Flip</option>
          <option value="v1_1">V 1.1 Push it</option>
          <option value="v1_0">V 1.0 OG</option>
        </select>
      </div>
    );
  };

  if (state.phase === 'setup') {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 relative">
        <div className="bg-slate-800 p-8 rounded-2xl shadow-xl max-w-md w-full">
          <h1 className="text-3xl font-black mb-2 text-center text-red-500 flex items-center justify-center gap-2">
            <Skull /> Yes, Mylord <Skull />
          </h1>
          <p className="text-slate-400 text-center mb-8">Ein böses Kartenspiel für 2-4 Spieler</p>
          
          <div className="space-y-4 mb-8">
            {playerNames.map((name, i) => (
              <div key={i}>
                <label className="block text-sm font-medium text-slate-400 mb-1">Spieler {i + 1} {i > 1 && '(Optional)'}</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => {
                    const newNames = [...playerNames];
                    newNames[i] = e.target.value;
                    setPlayerNames(newNames);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500"
                  placeholder={`Name Spieler ${i + 1}`}
                />
              </div>
            ))}
          </div>
          
          <div className="flex flex-col gap-3">
            <p className="text-center text-slate-400 text-sm mb-1">Wähle eine Version:</p>
            <select
              value={currentVersion}
              onChange={(e) => onSwitchVersion(e.target.value, playerNames.filter(n => n.trim() !== ''))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 outline-none focus:border-red-500 text-white font-medium"
            >
              <option value="v3_0">V 3.0 Multiplayer</option>
              <option value="v2_0">V 2.0 Captain Flip</option>
              <option value="v1_1">V 1.1 Push it</option>
              <option value="v1_0">V 1.0 OG</option>
            </select>
            <button
              type="button"
              onClick={() => handleStartVersion(currentVersion)}
              disabled={playerNames.filter(n => n.trim() !== '').length < 2}
              className="cursor-pointer w-full py-3 px-4 rounded-lg font-bold transition-colors disabled:opacity-50 bg-red-600 hover:bg-red-700 text-white shadow-lg mt-2"
            >
              Spiel starten
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderTable = () => (
    <div className="bg-slate-800/50 rounded-2xl p-4 sm:p-6 mb-4">
      <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
        {state.players.map(p => {
          const t = state.table[p.id];
          const isPhase1Hidden = 
            state.phase === 'ready_to_reveal' || 
            state.phase === 'reveal_master' || 
            ((state.phase === 'play_phase1' || state.phase === 'play_phase3') && p.id !== currentPlayerId);

          return (
            <div key={p.id} className={`flex flex-col items-center ${t.folded ? 'opacity-40' : ''}`}>
              <div className="flex flex-col items-center mb-2">
                <span className="font-bold text-sm sm:text-base">
                  {p.name}
                </span>
              </div>
              <div className="flex gap-2">
                {t.phase1 ? (
                  isPhase1Hidden ? <BlindCard /> : <PlayingCard card={t.phase1} disabled />
                ) : (
                  <div className="w-20 h-32 sm:w-24 sm:h-36 border-2 border-dashed border-slate-700 rounded-xl" />
                )}
                {t.phase3 ? <PlayingCard card={t.phase3} disabled /> : <div className="w-20 h-32 sm:w-24 sm:h-36 border-2 border-dashed border-slate-700 rounded-xl" />}
              </div>
              {t.folded && <span className="text-red-500 font-bold mt-2 text-sm">SÜNDENBOCK</span>}
              {(state.phase === 'ready_to_resolve' || state.phase === 'resolve_tie' || state.phase === 'distribute_penalties' || state.phase === 'round_end') && !t.folded && (
                <span className="mt-2 font-mono bg-slate-900 px-3 py-1 rounded-full text-yellow-400">
                  Summe: {(t.phase1?.value || 0) + (t.phase3?.value || 0)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderMasterArea = () => {
    const targetValue = state.masterCards.length === 2 ? state.masterCards[0].value + state.masterCards[1].value : null;
    return (
      <div className="flex flex-col items-center mb-6">
        <h3 className="text-slate-400 uppercase tracking-widest text-sm font-bold mb-4">Der Wille des Meisters</h3>
        <div className="flex gap-4 items-center">
          {state.masterCards.length === 2 ? (
            <>
              <PlayingCard card={state.masterCards[0]} disabled />
              <span className="text-2xl font-bold text-slate-500">+</span>
              <PlayingCard card={state.masterCards[1]} disabled />
              <span className="text-2xl font-bold text-slate-500">=</span>
              <div className="w-20 h-32 sm:w-24 sm:h-36 rounded-xl bg-purple-900 border-2 border-purple-400 flex flex-col items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.4)]">
                <span className="text-4xl font-black text-white">{targetValue}</span>
              </div>
            </>
          ) : (
            <>
              <CardBack />
              <CardBack />
            </>
          )}
        </div>
      </div>
    );
  };

  const renderTieDraws = () => {
    if (!state.tieDraws || state.tieDraws.length === 0) return null;
    return (
      <div className="mb-6 bg-slate-900/50 p-4 rounded-xl border border-slate-700 max-h-64 overflow-y-auto">
        <h4 className="text-sm font-bold text-slate-400 uppercase mb-3">Karten aus dem Stechen</h4>
        <div className="flex flex-col gap-4">
          {state.tieDraws.map((round, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <span className="text-xs text-slate-500 mb-2">Runde {idx + 1}</span>
              <div className="flex flex-wrap justify-center gap-4">
                {round.map((draw, dIdx) => (
                  <div key={dIdx} className="flex flex-col items-center">
                    <span className="text-xs font-bold mb-1 truncate max-w-[80px] text-slate-300">{draw.playerName}</span>
                    <div className="scale-75 origin-top mb-[-32px]">
                      <PlayingCard card={draw.card} disabled />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (state.phase !== 'setup' && state.phase !== 'game_over') {
    const isPlayPhase = state.phase === 'play_phase1' || state.phase === 'play_phase3';
    const winner = state.winners.length > 0 ? state.players.find(p => p.id === state.winners[0]) : null;

    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col p-4 sm:p-8 relative">
        {renderVersionDropdown()}
        <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-300">Runde {state.round}</h2>
            <div className="text-sm text-slate-400">
              Meisterstapel: {state.masterDeck.length} | Deck: {state.deck.length}
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3 sm:gap-6 mb-8 bg-slate-800/50 p-3 rounded-2xl border border-slate-700/50">
            {state.players.map(p => (
              <div key={p.id} className="flex items-center gap-2 bg-slate-900/50 px-3 py-1.5 rounded-full">
                <span className="font-bold text-sm text-slate-300">{p.name}</span>
                <span className="text-yellow-400 font-mono text-sm font-bold">{calculateScore(p.successPile)} Pkt</span>
              </div>
            ))}
          </div>

          {renderMasterArea()}
          {renderTable()}

          {(state.phase === 'ready_to_reveal' || state.phase === 'ready_to_resolve') && (
            <div className="flex justify-center mb-4">
              {state.phase === 'ready_to_reveal' && (
                <button
                  onClick={() => dispatch({ type: 'REVEAL_MASTER' })}
                  className="cursor-pointer bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-xl text-lg transition-colors shadow-[0_0_20px_rgba(147,51,234,0.5)] animate-pulse"
                >
                  Meisterkarten aufdecken
                </button>
              )}
              {state.phase === 'ready_to_resolve' && (
                <button
                  onClick={() => dispatch({ type: 'RESOLVE_ROUND' })}
                  className="cursor-pointer bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-8 rounded-xl text-lg transition-colors shadow-[0_0_20px_rgba(202,138,4,0.5)] animate-pulse"
                >
                  Auswertung starten
                </button>
              )}
            </div>
          )}

          <div className={`bg-slate-800 p-4 sm:p-6 rounded-2xl shadow-xl border border-slate-700 transition-opacity ${!isPlayPhase ? 'opacity-50 pointer-events-none' : ''}`}>
            <h3 className="text-lg font-bold mb-4 flex items-center justify-between">
              <span>Deine Hand, <span className="text-blue-400">{currentPlayer?.name}</span></span>
              <span className="text-sm font-normal text-slate-400">
                {scapegoatMode ? 'Wähle eine Karte für den Sündenbock' : 'Klicke eine Karte zum Ausspielen'}
              </span>
            </h3>
            
            <div className="flex flex-wrap gap-2 sm:gap-4 justify-center mb-6">
              {currentPlayer?.hand.map(card => (
                <PlayingCard
                  key={card.id}
                  card={card}
                  selected={scapegoatMode}
                  disabled={!isPlayPhase}
                  onClick={() => {
                    if (!isPlayPhase) return;
                    if (scapegoatMode) {
                      dispatch({ type: 'PLAY_SCAPEGOAT', payload: { cardId: card.id } });
                      setScapegoatMode(false);
                    } else {
                      dispatch({ type: 'PLAY_CARD', payload: { cardId: card.id } });
                    }
                  }}
                />
              ))}
            </div>

            <div className="flex gap-4 justify-center">
              {state.phase === 'play_phase3' && (
                <button
                  onClick={() => setScapegoatMode(!scapegoatMode)}
                  className={`cursor-pointer font-bold py-3 px-6 rounded-xl transition-colors border ${
                    scapegoatMode 
                      ? 'bg-red-600 hover:bg-red-700 text-white border-red-500' 
                      : 'bg-red-900 hover:bg-red-800 text-red-100 border-red-700'
                  }`}
                >
                  {scapegoatMode ? 'Sündenbock abbrechen' : 'Sündenbock spielen'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Overlays */}
        {state.phase === 'resolve_tie' && (
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="max-w-md w-full bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 text-center">
              <h2 className="text-3xl font-bold mb-4 text-yellow-500 flex items-center justify-center gap-2">
                <Crown /> Gleichstand! <Crown />
              </h2>
              <p className="mb-6 text-slate-300">
                {state.winners.map(id => state.players.find(p => p.id === id)?.name).join(' und ')} müssen ins Stechen!
              </p>
              
              {state.tieLogs.length > 0 && (
                <div className="bg-slate-900 p-4 rounded-lg mb-6 max-h-48 overflow-y-auto font-mono text-sm text-slate-400 text-left">
                  {state.tieLogs.map((log, i) => <div key={i} className="mb-1">{log}</div>)}
                </div>
              )}

              <button
                onClick={() => dispatch({ type: 'RESOLVE_TIE' })}
                className="cursor-pointer w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-xl text-lg transition-colors"
              >
                Stechen ausführen
              </button>
            </div>
          </div>
        )}

        {state.phase === 'distribute_penalties' && (
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="max-w-lg w-full bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 text-center">
              <h2 className="text-3xl font-bold mb-2 text-yellow-400">Bußgeld verteilen!</h2>
              <p className="mb-8 text-slate-400">
                {winner?.name} hat mit {state.winTier} gewonnen und darf die Guten Taten verteilen.
              </p>

              <div className="space-y-4 mb-8">
                {state.penalties.map(card => (
                  <div key={card.id} className="flex items-center justify-between bg-slate-900 p-4 rounded-xl">
                    <div className="flex items-center gap-4">
                      <PlayingCard card={card} disabled />
                      <div className="text-left">
                        <div className="font-bold text-lg">Gute Tat ({card.value})</div>
                        <div className="text-sm text-slate-400">Wem geben?</div>
                      </div>
                    </div>
                    <select
                      value={state.penaltyAssignments[card.id] ?? winner?.id}
                      onChange={(e) => dispatch({ type: 'SET_PENALTY_ASSIGNMENT', payload: { cardId: card.id, playerId: Number(e.target.value) } })}
                      className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white outline-none focus:border-yellow-500"
                    >
                      {state.players.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              
              <button
                onClick={() => dispatch({ type: 'SUBMIT_PENALTIES' })}
                className="cursor-pointer w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-xl text-xl transition-colors"
              >
                Verteilung bestätigen
              </button>
            </div>
          </div>
        )}

        {state.phase === 'round_end' && (
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 p-4 gap-6">
            {state.penalties.length > 0 ? (
              <button
                onClick={() => dispatch({ type: 'START_PENALTIES' })}
                className="cursor-pointer w-full max-w-md bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-xl text-xl transition-colors shadow-lg"
              >
                Bußgeld verteilen
              </button>
            ) : (
              <button
                onClick={() => dispatch({ type: 'END_ROUND' })}
                className="cursor-pointer w-full max-w-md bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl text-xl transition-colors shadow-lg"
              >
                Nächste Runde
              </button>
            )}
            <div className="max-w-md w-full bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 text-center">
              {state.winners.length > 0 ? (
                <>
                  <h2 className="text-4xl font-black mb-4 text-yellow-400 flex items-center justify-center gap-3">
                    <Crown size={40} /> {winner?.name} gewinnt!
                  </h2>
                  <p className="mb-8 text-xl text-slate-300">
                    Sieg-Typ: <strong className={state.winTier === 'Gold' ? 'text-yellow-400' : state.winTier === 'Silver' ? 'text-slate-300' : 'text-amber-600'}>{state.winTier}</strong>
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-4xl font-black mb-4 text-slate-400 flex items-center justify-center gap-3">
                    Niemand gewinnt!
                  </h2>
                  <p className="mb-8 text-xl text-slate-300">
                    Alle Spieler haben den Sündenbock gespielt.
                  </p>
                </>
              )}

              {renderTieDraws()}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (state.phase === 'game_over') {
    const sortedPlayers = [...state.players].sort((a, b) => calculateScore(b.successPile) - calculateScore(a.successPile));
    const overallWinner = sortedPlayers[0];

    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4 relative">
        {renderVersionDropdown()}
        <div className="max-w-2xl w-full bg-slate-800 p-8 rounded-3xl shadow-2xl border border-slate-700">
          <h1 className="text-5xl font-black mb-4 text-center text-yellow-400">Spielende!</h1>
          <h2 className="text-2xl text-center mb-12 text-slate-300">
            Die neue rechte Hand des Meisters ist <strong className="text-white">{overallWinner.name}</strong>!
          </h2>

          <div className="space-y-4">
            {sortedPlayers.map((p, i) => (
              <div key={p.id} className={`flex items-center justify-between p-4 rounded-xl ${i === 0 ? 'bg-yellow-900/30 border border-yellow-700/50' : 'bg-slate-900'}`}>
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-black text-slate-500">#{i + 1}</span>
                  <span className="text-xl font-bold">{p.name}</span>
                </div>
                <span className="text-2xl font-mono text-yellow-400">{calculateScore(p.successPile)} Pkt</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => window.location.reload()}
            className="cursor-pointer w-full mt-12 bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 px-6 rounded-xl text-xl transition-colors"
          >
            Neues Spiel
          </button>
        </div>
      </div>
    );
  }

  return null;
}
