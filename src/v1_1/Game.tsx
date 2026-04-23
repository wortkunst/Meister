import React, { useReducer, useState } from 'react';
import { gameReducer, initialState } from './reducer';
import { Card, Player } from './types';
import { Skull, Heart, Crown, ArrowRight, ShieldAlert, EyeOff, CheckCircle2, XCircle } from 'lucide-react';

function CardBack({ onClick, selected, disabled }: { onClick?: () => void, selected?: boolean, disabled?: boolean }) {
  return (
    <div 
      onClick={disabled ? undefined : onClick}
      className={`relative w-20 h-32 sm:w-24 sm:h-36 rounded-xl border-2 border-slate-700 bg-slate-800 flex items-center justify-center transition-transform select-none
        ${selected ? 'ring-4 ring-yellow-400 scale-105 z-10' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}
      `}
    >
      <div className="w-16 h-24 border border-slate-600 rounded-lg opacity-50 flex items-center justify-center">
        <ShieldAlert size={24} className="text-slate-600" />
      </div>
    </div>
  );
}

function PlayingCard({ card, onClick, selected, disabled }: { card: Card, onClick?: () => void, selected?: boolean, disabled?: boolean }) {
  if (card.hidden) {
    return <CardBack onClick={onClick} selected={selected} disabled={disabled} />;
  }
  const isMaster = card.type === 'master';
  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={`relative w-20 h-32 sm:w-24 sm:h-36 rounded-xl border-2 flex flex-col items-center justify-center transition-transform select-none
        ${isMaster ? 'bg-purple-950 border-purple-500 text-purple-100' : 'bg-slate-100 border-slate-400 text-slate-900'}
        ${selected ? 'ring-4 ring-yellow-400 scale-105 z-10' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}
      `}
    >
      <span className="text-[9px] sm:text-[11px] font-bold text-center px-1 leading-tight mb-1 uppercase opacity-70">
        {isMaster ? 'Meister' : 'Diener'}
      </span>
      <span className="text-2xl sm:text-3xl font-bold">{card.value}</span>
      <span className="text-[10px] sm:text-xs uppercase mt-2 opacity-70 flex items-center gap-1">
        {isMaster ? <Crown size={12} /> : <Heart size={12} />}
      </span>
    </div>
  );
}



export default function Game({ onSwitchVersion, currentVersion, initialPlayers }: { onSwitchVersion: (v: string, players?: string[] | null) => void, currentVersion: string, initialPlayers?: string[] | null }) {
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
          onChange={(e) => onSwitchVersion(e.target.value, state.players.map(p => p.name))}
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
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4 relative">
        <div className="max-w-md w-full bg-slate-800 p-8 rounded-3xl shadow-2xl border border-slate-700">
          <div className="flex justify-center mb-6">
            <Crown size={64} className="text-purple-500" />
          </div>
          <h1 className="text-4xl font-black mb-2 text-center text-white tracking-tight">Meister & Diener</h1>
          <p className="text-slate-400 text-center mb-4 font-medium">Version 1.1</p>
          
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 mb-8 text-sm text-slate-300 space-y-2">
            <h3 className="font-bold text-white mb-2">Kurzregeln V 1.1 "Push it"</h3>
            <ul className="list-disc pl-4 space-y-1">
              <li><strong>Ziel:</strong> Mit Dienerkarten (1-7) möglichst nah an die Meisterkarte (1-7) herankommen, ohne sie zu übertreffen.</li>
              <li><strong>Ablauf:</strong> Jeder zieht reihum eine verdeckte Karte oder stoppt.</li>
              <li><strong>Wertung:</strong> 
                <ul className="list-[circle] pl-4 mt-1">
                  <li>Überkauft (BUST): Differenz als Minuspunkte.</li>
                  <li>Gestoppt: Differenz zum Ziel als Minuspunkte.</li>
                  <li>Bester Wert: 0 Punkte.</li>
                  <li>Exakter Treffer: +3 Punkte (max. 0 Gesamtpunkte).</li>
                </ul>
              </li>
              <li><strong>Gleichstand:</strong> Bei Gleichstand des höchsten Wertes müssen die betroffenen Spieler eine weitere Karte ziehen ("Übereifrig").</li>
              <li><strong>Ende:</strong> Das Spiel endet, wenn ein Spieler -20 Punkte erreicht.</li>
            </ul>
          </div>

          <div className="space-y-4 mb-8">
            {playerNames.map((name, i) => (
              <div key={i} className="flex flex-col">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 ml-1">Spieler {i + 1}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    const newNames = [...playerNames];
                    newNames[i] = e.target.value;
                    setPlayerNames(newNames);
                  }}
                  placeholder={`Name Spieler ${i + 1} ${i >= 2 ? '(Optional)' : ''}`}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-medium"
                />
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-center text-slate-400 text-sm mb-1">Wähle eine Version:</p>
            <select
              value={currentVersion}
              onChange={(e) => onSwitchVersion(e.target.value, playerNames.filter(n => n.trim() !== ''))}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-purple-500 text-white font-medium"
            >
              <option value="v3_0">V 3.0 Multiplayer</option>
              <option value="v2_0">V 2.0 Captain Flip</option>
              <option value="v1_1">V 1.1 Push it</option>
              <option value="v1_0">V 1.0 OG</option>
            </select>
            <button
              onClick={() => handleStartVersion(currentVersion)}
              disabled={playerNames.filter(n => n.trim() !== '').length < 2}
              className="cursor-pointer w-full py-3 px-4 rounded-xl font-bold transition-colors disabled:opacity-50 bg-purple-600 hover:bg-purple-700 text-white shadow-lg mt-2"
            >
              Spiel starten
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (state.phase === 'game_over') {
    const sortedPlayers = [...state.players].sort((a, b) => b.score - a.score);
    const overallWinner = sortedPlayers[0];

    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4 relative">
        {renderVersionDropdown()}
        <div className="max-w-2xl w-full bg-slate-800 p-8 rounded-3xl shadow-2xl border border-slate-700">
          <h1 className="text-5xl font-black mb-4 text-center text-yellow-400">Spielende!</h1>
          <h2 className="text-2xl text-center mb-12 text-slate-300">
            Gewinner ist <strong className="text-white">{overallWinner.name}</strong> mit den wenigsten Strafpunkten!
          </h2>

          <div className="space-y-4">
            {sortedPlayers.map((p, i) => (
              <div key={p.id} className={`flex items-center justify-between p-4 rounded-xl ${i === 0 ? 'bg-yellow-900/30 border border-yellow-700/50' : 'bg-slate-900'}`}>
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-black text-slate-500">#{i + 1}</span>
                  <span className="text-xl font-bold">{p.name}</span>
                </div>
                <span className={`text-2xl font-mono ${p.score < 0 ? 'text-red-400' : 'text-green-400'}`}>{p.score} Pkt.</span>
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

  // Active Game Phases
  const currentPlayer = state.players.find(p => p.id === state.currentDecisionPlayerId);

  const totalServants = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7 };
  const remainingServants = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
  if (state.servantDeck) {
    state.servantDeck.forEach(c => {
      if (c.value >= 1 && c.value <= 7) {
        remainingServants[c.value as keyof typeof remainingServants]++;
      }
    });
  }
  // Add hidden cards back to the remaining count so players can't deduce them
  state.players.forEach(p => {
    p.cards.forEach(c => {
      if (c.hidden && c.value >= 1 && c.value <= 7) {
        remainingServants[c.value as keyof typeof remainingServants]++;
      }
    });
  });

  const totalMasters = { 10: 1, 12: 1, 13: 2, 14: 3, 15: 3, 16: 3, 17: 2, 18: 1, 20: 1 };
  const remainingMasters = { 10: 0, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 17: 0, 18: 0, 20: 0 };
  if (state.masterDeck) {
    state.masterDeck.forEach(c => {
      if (c.value in remainingMasters) {
        remainingMasters[c.value as keyof typeof remainingMasters]++;
      }
    });
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-8 relative">
      {renderVersionDropdown()}
      
      {/* Remaining Cards Display */}
      {state.phase !== 'setup' && state.phase !== 'game_over' && (
        <div className="absolute top-4 left-4 z-50 flex flex-col gap-2">
          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/50 backdrop-blur-sm">
            <h3 className="text-slate-400 uppercase tracking-widest text-[10px] font-bold mb-2">Meisterstapel</h3>
            <ul className="text-[10px] sm:text-xs font-mono text-slate-300 space-y-1">
              {[10, 12, 13, 14, 15, 16, 17, 18, 20].map(val => {
                const count = remainingMasters[val as keyof typeof remainingMasters];
                const total = totalMasters[val as keyof typeof totalMasters];
                return (
                  <li key={val} className="flex items-center gap-1">
                    {Array.from({ length: total }).map((_, i) => (
                      <span key={i} className={i >= count ? "line-through text-red-500" : "text-white"}>
                        {val}
                      </span>
                    ))}
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/50 backdrop-blur-sm">
            <h3 className="text-slate-400 uppercase tracking-widest text-[10px] font-bold mb-2">Dienerstapel</h3>
            <ul className="text-[10px] sm:text-xs font-mono text-slate-300 space-y-1">
              {[1, 2, 3, 4, 5, 6, 7].map(val => {
                const count = remainingServants[val as keyof typeof remainingServants];
                const total = totalServants[val as keyof typeof totalServants];
                return (
                  <li key={val} className="flex items-center gap-1">
                    {Array.from({ length: total }).map((_, i) => (
                      <span key={i} className={i >= count ? "line-through text-red-500" : "text-white"}>
                        {val}
                      </span>
                    ))}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* Header: Players and Scores */}
        <div className="flex flex-wrap justify-center gap-3 sm:gap-6 mb-8 bg-slate-800/50 p-3 rounded-2xl border border-slate-700/50">
          {state.players.map(p => (
            <div key={p.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${p.status === 'BUST' ? 'bg-red-900/30 border border-red-800/50' : p.status === 'STOPPED' ? 'bg-slate-700/50' : 'bg-slate-900/50'}`}>
              <span className="font-bold text-sm text-slate-300">{p.name}</span>
              <span className={`font-mono text-sm font-bold ${p.score < 0 ? 'text-red-400' : 'text-green-400'}`}>{p.score} Pkt</span>
              {p.status === 'BUST' && <Skull size={14} className="text-red-500" />}
              {p.status === 'STOPPED' && <CheckCircle2 size={14} className="text-slate-400" />}
            </div>
          ))}
        </div>

        {/* Master Card Area */}
        <div className="flex flex-col items-center mb-8">
          {state.currentMasterCard ? (
            <PlayingCard card={state.currentMasterCard} disabled />
          ) : (
            <CardBack />
          )}
        </div>

        {/* Player Areas */}
        <div className={`grid gap-4 sm:gap-8 mb-12 ${state.players.length === 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-6xl mx-auto' : state.players.length === 3 ? 'grid-cols-1 sm:grid-cols-3 max-w-6xl mx-auto' : 'grid-cols-2 lg:grid-cols-4'}`}>
          {state.players.map(p => (
            <div key={p.id} className={`flex flex-col items-center p-4 rounded-2xl border ${p.id === state.currentDecisionPlayerId ? 'border-purple-500 bg-purple-900/20' : 'border-slate-800 bg-slate-800/30'} ${p.status === 'BUST' ? 'opacity-50' : ''}`}>
              <span className="font-bold text-lg mb-2 flex items-center gap-2">
                {p.name}
                {p.id === state.startingPlayerId && (
                  <span className="text-[10px] bg-purple-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">Startspieler</span>
                )}
              </span>
              <div className="flex flex-wrap justify-center mb-4">
                {p.cards.map((c, idx) => (
                  <div key={c.id} style={{ marginLeft: idx > 0 ? '-20px' : '0' }}>
                    <PlayingCard card={c} disabled />
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="text-sm text-slate-400">Gesamt: </span>
                <span className={`font-mono font-bold text-xl ${p.status === 'BUST' ? 'text-red-500' : 'text-white'}`}>
                  {p.cards.some(c => c.hidden) ? `${p.roundTotal}+?` : p.roundTotal}
                </span>
                {p.status === 'BUST' && <span className="text-red-500 font-bold flex items-center gap-1 ml-2"><XCircle size={16} /> BUST</span>}
                {p.status === 'STOPPED' && p.roundTotal === state.currentMasterCard?.value ? (
                  <span className="text-green-500 font-bold flex items-center gap-1 ml-2"><CheckCircle2 size={16} /> EXACT!</span>
                ) : p.status === 'STOPPED' ? (
                  <span className="text-slate-400 font-bold flex items-center gap-1 ml-2"><CheckCircle2 size={16} /> STOP</span>
                ) : null}
              </div>
            </div>
          ))}
        </div>

          {state.phase === 'round_scoring' && (
            <button
              onClick={() => dispatch({ type: 'START_NEXT_ROUND' })}
              className="cursor-pointer block mx-auto w-full max-w-md mb-6 bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-6 rounded-xl text-xl transition-colors shadow-lg"
            >
              Nächste Runde
            </button>
          )}

          {state.phase === 'resolve_tie' && (
            <button
              onClick={() => dispatch({ type: 'UBEREIFRIG' })}
              className="cursor-pointer block mx-auto w-full max-w-md mb-6 bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 px-6 rounded-xl text-xl transition-colors shadow-lg animate-pulse"
            >
              ÜBEREIFRIG
            </button>
          )}

          <div className="max-w-md mx-auto bg-slate-800 p-6 rounded-3xl border border-slate-700 text-center">
            {state.phase === 'make_decision' && currentPlayer && (
              <>
                <h2 className="text-2xl font-bold mb-6">{currentPlayer.name}?</h2>
                <div className="flex gap-4">
                  <button
                    onClick={() => dispatch({ type: 'MAKE_DECISION', payload: { decision: 'WEITER' } })}
                    className="cursor-pointer flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-xl text-xl transition-colors shadow-lg"
                  >
                    Karte her!
                  </button>
                  <button
                    onClick={() => dispatch({ type: 'MAKE_DECISION', payload: { decision: 'STOP' } })}
                    className="cursor-pointer flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-xl text-xl transition-colors shadow-lg"
                  >
                    Hör auf!
                  </button>
                </div>
              </>
            )}

            {state.phase === 'resolve_tie' && (
              <>
                <h2 className="text-2xl font-bold mb-4 text-orange-500">Gleichstand!</h2>
                <p className="text-slate-300 mb-6">
                  Mehrere Spieler haben den gleichen höchsten Wert erreicht. Klicke auf "ÜBEREIFRIG", um den betroffenen Spielern eine weitere Karte zuzuteilen!
                </p>
              </>
            )}

            {state.phase === 'round_scoring' && (
              <>
                <h2 className="text-2xl font-bold mb-6">Rundenwertung</h2>
                {state.roundResults && (
                  <div className="space-y-2 text-left">
                    {state.roundResults.map(r => {
                      const p = state.players.find(pl => pl.id === r.playerId);
                      return (
                        <div key={r.playerId} className="flex justify-between items-center bg-slate-900 p-3 rounded-lg">
                          <span className="font-bold">{p?.name}</span>
                          <div className="flex items-center gap-2">
                            <span className={`font-mono font-bold ${r.scoreDelta < 0 ? 'text-red-400' : 'text-green-400'}`}>
                              {r.scoreDelta > 0 ? '+' : ''}{r.scoreDelta} Pkt
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
      </div>
    </div>
  );
}
