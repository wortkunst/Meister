import React, { useReducer, useState } from 'react';
import { motion } from 'motion/react';
import { gameReducer, initialState } from './reducer';
import { Card, Player } from './types';
import { Skull, Crown, AlertTriangle, Eye, EyeOff, Shield, Archive, Activity, Zap, Droplet } from 'lucide-react';

const typeIcons: Record<string, React.ReactNode> = {
  'Käfig': <Archive size={32} />,
  'Hinterhalt!': <AlertTriangle size={32} />,
  'Schrottrüstung': <Shield size={32} />,
  'Glitzerklunker': <Crown size={32} />,
  'Von hinten geschubst': <Activity size={32} />,
  'Lugloch': <Eye size={32} />,
  'Geheimfach': <EyeOff size={32} />,
  'Des Meisters Fluch': <Skull size={32} />,
  'Auswahlelixir': <Zap size={32} />,
  'Dynamit': <AlertTriangle size={32} className="text-red-400" />,
  'Löschwasser': <Droplet size={32} className="text-blue-400" />,
};

const typeColors: Record<string, { bg: string, text: string, border: string }> = {
  'Käfig': { bg: 'bg-[#2d2a26]', text: 'text-stone-300', border: 'border-stone-600' },
  'Hinterhalt!': { bg: 'bg-[#4a2e15]', text: 'text-orange-200', border: 'border-orange-700' },
  'Schrottrüstung': { bg: 'bg-[#2b3544]', text: 'text-slate-300', border: 'border-slate-500' },
  'Glitzerklunker': { bg: 'bg-[#4a3f15]', text: 'text-yellow-200', border: 'border-yellow-600' },
  'Von hinten geschubst': { bg: 'bg-[#4a1532]', text: 'text-pink-200', border: 'border-pink-700' },
  'Lugloch': { bg: 'bg-[#2d154a]', text: 'text-purple-200', border: 'border-purple-700' },
  'Geheimfach': { bg: 'bg-[#15204a]', text: 'text-indigo-200', border: 'border-indigo-700' },
  'Des Meisters Fluch': { bg: 'bg-[#3b1212]', text: 'text-red-200', border: 'border-red-700' },
  'Auswahlelixir': { bg: 'bg-[#123b28]', text: 'text-emerald-200', border: 'border-emerald-700' },
  'Dynamit': { bg: 'bg-[#5e1919]', text: 'text-red-100', border: 'border-red-600' },
  'Löschwasser': { bg: 'bg-[#193a5e]', text: 'text-blue-100', border: 'border-blue-600' },
};

const CardView = ({ card, isSecret, onClick, selectable }: { card: Card, isSecret?: boolean, onClick?: () => void, selectable?: boolean }) => {
  const formatCardType = (type: string) => {
    if (type === 'Hinterhalt!') return 'Hinter-\nhalt!';
    if (type === 'Schrottrüstung') return 'Schrott-\nRüstung';
    return type;
  };

  if (isSecret) {
    return (
      <div 
        onClick={onClick}
        className={`w-40 md:w-48 aspect-[1050/1498] bg-slate-700/80 rounded-xl border flex flex-col items-center justify-center text-slate-400 transition-transform hover:-translate-y-2 cursor-pointer shadow-lg ${selectable ? 'border-[3px] border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)] animate-pulse' : 'border-slate-600'}`}
      >
        <EyeOff size={48} className="mb-2" />
        <span className="text-xl text-center font-medium px-2">Geheimfach-Inhalt</span>
      </div>
    );
  }

  const colorScheme = typeColors[card.type] || { bg: 'bg-slate-800', text: 'text-slate-300', border: 'border-slate-600' };
  const borderColor = selectable ? 'border-[3px] border-yellow-400 cursor-pointer shadow-[0_0_15px_rgba(250,204,21,0.6)] animate-pulse' : colorScheme.border;
  
  if (card.type === 'Hinterhalt!') {
    const imgSrc = '/images/hinterhalt-kein-wert.png';
    return (
      <div 
        onClick={onClick}
        className={`relative w-40 md:w-48 aspect-[1050/1498] rounded-xl border flex flex-col items-center justify-between select-none ${borderColor} shadow-md transition-transform duration-200 hover:-translate-y-2 overflow-hidden bg-black`}
      >
        <img src={imgSrc} alt={`Hinterhalt ${card.value}`} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute top-[3%] right-[8%] w-[20%] aspect-square flex items-center justify-center z-10">
            <span className="text-3xl md:text-4xl font-black text-[#d6b014] drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                {card.value}
            </span>
        </div>
      </div>
    );
  }

  const displayText = formatCardType(card.type);

  return (
    <div 
      onClick={onClick}
      className={`relative w-40 md:w-48 aspect-[1050/1498] ${colorScheme.bg} ${colorScheme.text} rounded-xl border flex flex-col items-center justify-between p-3 md:p-4 select-none ${borderColor} shadow-md transition-transform duration-200 hover:-translate-y-2`}
    >
      <div className="flex justify-between w-full items-start drop-shadow-md">
        <span className="text-3xl font-black leading-none">{card.value}</span>
        {typeIcons[card.type]}
      </div>
      <div className="text-center text-lg uppercase font-bold tracking-wider mt-1 opacity-90 leading-tight whitespace-pre-wrap">
        {displayText}
      </div>
      <div className="flex justify-between w-full rotate-180 drop-shadow-md">
        <span className="text-3xl font-black leading-none">{card.value}</span>
        {typeIcons[card.type]}
      </div>
    </div>
  );
};

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

  if (state.phase === 'setup') {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-8 flex flex-col items-center justify-center font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold tracking-tighter bg-gradient-to-br from-emerald-400 to-cyan-500 bg-clip-text text-transparent">Setup</h1>
            <select 
              value={currentVersion}
              onChange={(e) => handleStartVersion(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1 text-sm outline-none"
            >
              <option value="v3_0">Version 3.0 (Multiplayer)</option>
              <option value="v2_0">Version 2.0 (Captain Flip)</option>
              <option value="v1_1">Version 1.1 (Push it)</option>
              <option value="v1_0">Version 1.0 (Basis)</option>
            </select>
          </div>

          <div className="space-y-4 mb-8">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="flex flex-col">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">Spieler {i + 1} {i >= 2 ? '(Optional)' : ''}</label>
                <input
                  type="text"
                  value={playerNames[i]}
                  onChange={e => {
                    const newNames = [...playerNames];
                    newNames[i] = e.target.value;
                    setPlayerNames(newNames);
                  }}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-cyan-500 transition-colors"
                  placeholder={`Name eingeben...`}
                />
              </div>
            ))}
          </div>

          <button
            onClick={() => handleStartVersion(currentVersion)}
            disabled={playerNames.filter(n => n.trim() !== '').length < 2}
            className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]"
          >
            V2.0 Starten
          </button>
        </div>
      </div>
    );
  }

  const currentPlayer = state.players[state.currentPlayerIndex];

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col items-center pt-2 pb-24">
      <div className="w-full max-w-full px-2 lg:px-4 flex justify-between items-center mb-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-emerald-400">V2.0 CAPTAIN FLIP</h1>
          <p className="text-sm text-slate-400">Runde {state.round}</p>
        </div>
        <div className="flex gap-4">
          <div className="text-center">
            <span className="block text-xs text-slate-500 uppercase tracking-widest">Deck</span>
            <span className="font-mono text-xl">{state.deck.length}</span>
          </div>
          <div className="text-center">
            <span className="block text-xs text-slate-500 uppercase tracking-widest">Ablage</span>
            <span className="font-mono text-xl">{state.discardPile.length}</span>
          </div>
        </div>
      </div>

      <div className="w-full max-w-full px-2 lg:px-4 flex flex-wrap justify-center gap-2 mb-4">
        {state.players.map(p => (
          <div key={p.id} className={`flex-1 min-w-[350px] 2xl:min-w-[500px] p-3 md:p-4 rounded-xl border ${p.id === currentPlayer?.id ? 'border-emerald-500 bg-emerald-900/10' : 'border-slate-800 bg-slate-900/50'} ${p.status === 'BUSTED' ? 'opacity-50' : ''}`}>
            <div className="flex justify-between items-center mb-2">
              <div>
                <h3 className="font-bold text-lg">{p.name}</h3>
                <span className="text-xs text-slate-400">{p.status}</span>
              </div>
              <div className="flex gap-4 text-right">
                <div>
                  <div className="text-xl font-bold text-emerald-400">
                     {p.status === 'BUSTED' ? 0 : 
                        p.display.filter(i => !i.isBusted && !i.isSecret).reduce((sum, i) => sum + i.card.value + (i.cagedBy ? i.cagedBy.value : 0), 0)
                     }
                     {p.display.some(i => i.isSecret && !i.isBusted) && p.status !== 'BUSTED' ? ' + ?' : ''}
                  </div>
                  <div className="text-[9px] text-emerald-600/70 uppercase">Runde</div>
                </div>
                <div>
                  <div className="text-2xl font-black font-mono">{p.score}</div>
                  <div className="text-[10px] text-slate-500 uppercase">Gesamt</div>
                </div>
              </div>
            </div>
            
            <div className="flex overflow-x-auto overflow-y-visible pb-12 pt-2 px-2 items-start min-h-[250px] md:min-h-[300px] custom-scrollbar w-full" style={{ gap: '0' }}>
              {p.display.map((item, idx) => {
                const opponentsHaveCards = state.players.some(pl => pl.id !== currentPlayer?.id && pl.status === 'PLAYING' && pl.display.length > 0);
                const canTargetWithHinterhalt = p.status === 'PLAYING'; // Anyone playing can be targeted
                
                const isHinterhaltTargetableBase = state.phase === 'hinterhalt_decision' && canTargetWithHinterhalt && !item.cagedBy && item.card.id !== state.pendingActionCard?.id;
                const isHinterhaltTargetableCage = state.phase === 'hinterhalt_decision' && canTargetWithHinterhalt && !!item.cagedBy && item.cagedBy.id !== state.pendingActionCard?.id;
                const isCageTargetable = state.phase === 'cage_decision' && p.id === currentPlayer?.id && !item.cagedBy && (item.isSecret || item.card.type !== 'Käfig');
                const selectable = isCageTargetable || isHinterhaltTargetableBase;
                
                return (
                  <div key={item.id} className="relative transition-all shrink-0" style={{ marginLeft: idx > 0 ? '-80px' : '0', zIndex: idx }}>
                    <motion.div
                      initial={item.isBusted ? { filter: 'grayscale(0%) opacity(1)' } : false}
                      animate={item.isBusted ? {
                          filter: [
                              'grayscale(0%) opacity(1)', 
                              'sepia(100%) hue-rotate(-50deg) saturate(500%) opacity(1) drop-shadow(0px 0px 30px red)', 
                              'grayscale(100%) opacity(0.6)'
                          ],
                          scale: [1, 1.1, 1.1, 1],
                          rotate: [0, -10, 10, -10, 10, 0]
                      } : { filter: 'grayscale(0%) opacity(1)', scale: 1, rotate: 0 }}
                      transition={{ duration: 0.8, ease: "easeInOut" }}
                    >
                      <CardView 
                        card={item.card} 
                        isSecret={item.isSecret} 
                        selectable={selectable} 
                        onClick={() => {
                          if (isCageTargetable) {
                            dispatch({ type: 'CAGE_TARGET', payload: { targetId: item.id } });
                          } else if (isHinterhaltTargetableBase) {
                            dispatch({ type: 'HINTERHALT_TARGET', payload: { targetPlayerId: p.id, targetId: item.id } });
                          }
                        }} 
                      />
                      {item.isBusted && (
                          <>
                            <motion.div 
                               initial={{ scale: 0, opacity: 1 }}
                               animate={{ scale: [0, 2, 4], opacity: [1, 1, 0] }}
                               transition={{ duration: 0.6, ease: "easeOut" }}
                               className="absolute inset-0 flex items-center justify-center pointer-events-none z-50 text-[5rem]"
                            >
                                💥
                            </motion.div>
                            <motion.div
                               initial={{ opacity: 0, scale: 3 }}
                               animate={{ opacity: 1, scale: 1 }}
                               transition={{ delay: 0.5, type: "spring", stiffness: 200, damping: 10 }}
                               className="absolute inset-0 flex items-center justify-center pointer-events-none z-40"
                            >
                                <span className="text-red-600 text-7xl md:text-8xl font-black drop-shadow-[0_0_15px_rgba(220,38,38,0.8)] rotate-12">X</span>
                            </motion.div>
                          </>
                      )}
                    </motion.div>
                    {item.cagedBy && (
                      <div className={`absolute top-12 -right-8 md:top-16 md:-right-10 rotate-[15deg] z-10 ${item.isBusted ? 'grayscale opacity-60' : 'opacity-90 hover:opacity-100 transition-opacity'}`}>
                        <CardView 
                          card={item.cagedBy} 
                          selectable={isHinterhaltTargetableCage}
                          onClick={() => {
                            if (isHinterhaltTargetableCage) {
                              dispatch({ type: 'HINTERHALT_TARGET', payload: { targetPlayerId: p.id, targetId: item.id, isCageTarget: true } });
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
              {p.display.length > 0 && <div className="w-8 shrink-0"></div>}
            </div>
          </div>
        ))}
      </div>

      <div className="w-full max-w-full px-2 lg:px-4 mb-20">
         <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 h-20 md:h-24 overflow-y-auto flex flex-col-reverse shadow-inner">
             {state.eventLog.slice().reverse().map((log, i) => (
                <div key={log.id} className={`text-xs md:text-sm py-0.5 ${i === 0 ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>
                   • {log.msg}
                </div>
             ))}
             {state.eventLog.length === 0 && <div className="text-slate-600 text-xs italic">Spielprotokoll...</div>}
         </div>
      </div>

      {/* Main Action Area */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 p-6 flex justify-center z-50">
        <div className="max-w-2xl w-full text-center">
          
          {(() => {
            const hasElixir = currentPlayer && currentPlayer.display.length > 0 && 
              currentPlayer.display[currentPlayer.display.length - 1].card.type === 'Auswahlelixir' &&
              !currentPlayer.display[currentPlayer.display.length - 1].cagedBy &&
              !currentPlayer.display[currentPlayer.display.length - 1].isSecret &&
              !currentPlayer.display[currentPlayer.display.length - 1].elixirUsed;

            return state.phase === 'playing' && currentPlayer && currentPlayer.status === 'PLAYING' && (
              <div className="flex gap-4">
                <button
                  onClick={() => dispatch({ type: 'DRAW_CARD' })}
                  className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-lg shadow-lg"
                >
                  {hasElixir ? 'Karten ziehen' : 'Karte ziehen'}
                </button>
                {currentPlayer.display.length > 0 && (
                  <button
                    onClick={() => dispatch({ type: 'STOP' })}
                    className="flex-1 py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-lg shadow-lg"
                  >
                    Hör auf!
                  </button>
                )}
              </div>
            );
          })()}

          {state.phase === 'geheimfach_decision' && currentPlayer && currentPlayer.status === 'PLAYING' && (
             <div className="flex flex-col items-center">
                <span className="text-indigo-400 font-bold mb-2 uppercase tracking-widest text-sm">Geheimfach gespielt!</span>
                <p className="text-sm text-slate-400 mb-4">Du hast ein Geheimfach. Ziehe nun den Inhalt verdeckt heraus.</p>
                <div className="flex gap-4 w-full">
                  <button onClick={() => dispatch({ type: 'DRAW_SECRET_CARD' })} className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-lg shadow-lg">Geheimkarte ziehen</button>
                </div>
             </div>
          )}

          {state.phase === 'geschubst_decision' && currentPlayer && currentPlayer.status === 'PLAYING' && (
             <div className="flex flex-col items-center">
                <span className="text-orange-400 font-bold mb-2 uppercase tracking-widest text-sm">Von hinten geschubst!</span>
                <p className="text-sm text-slate-400 mb-4">Du wurdest geschubst und musst sofort weiterziehen!</p>
                <div className="flex gap-4 w-full">
                  <button onClick={() => dispatch({ type: 'DRAW_CARD' })} className="flex-1 py-4 bg-emerald-600 font-bold rounded-xl text-lg">Karte ziehen</button>
                </div>
             </div>
          )}

          {state.phase === 'lugloch_decision' && state.pendingCards.length === 1 && (
             <div className="flex flex-col items-center">
                <span className="text-yellow-400 mb-2 font-bold uppercase tracking-widest text-sm">Lugloch: Angesehene Karte</span>
                <div className="mb-6 transform scale-110">
                   <CardView card={state.pendingCards[0]} />
                </div>
                <div className="flex gap-4 w-full">
                  <button onClick={() => dispatch({ type: 'LUGLOCH_PLAY' })} className="flex-1 py-3 bg-emerald-600 font-bold rounded-xl">Spielen</button>
                  <button onClick={() => dispatch({ type: 'LUGLOCH_RETURN' })} className="flex-1 py-3 bg-slate-700 font-bold rounded-xl">Zurücklegen</button>
                </div>
             </div>
          )}

          {state.phase === 'elixir_decision' && state.pendingCards.length === 2 && (
             <div className="flex flex-col items-center w-full">
                <span className="text-indigo-400 mb-4 font-bold uppercase tracking-widest text-sm">Auswahlelixir: Wähle eine Karte</span>
                <div className="flex gap-8 mb-6">
                   <div onClick={() => dispatch({ type: 'ELIXIR_CHOOSE', payload: { index: 0 } })} className="cursor-pointer hover:scale-105 transition-transform"><CardView card={state.pendingCards[0]} selectable /></div>
                   <div onClick={() => dispatch({ type: 'ELIXIR_CHOOSE', payload: { index: 1 } })} className="cursor-pointer hover:scale-105 transition-transform"><CardView card={state.pendingCards[1]} selectable /></div>
                </div>
             </div>
          )}

          {state.phase === 'cage_decision' && (
             <div>
                <span className="text-orange-400 font-bold text-lg">Käfig gespielt!</span>
                <p className="text-sm text-slate-400 mt-2">Wähle eine Karte in deiner Auslage, um sie einzusperren.</p>
             </div>
          )}

          {state.phase === 'hinterhalt_decision' && (
             <div>
                <span className="text-orange-400 font-bold text-lg">Hinterhalt! gespielt!</span>
                <p className="text-sm text-slate-400 mt-2">Klicke auf die Karte eines Ziels (gelb umrandet), um sie abzuwerfen.</p>
             </div>
          )}

          {state.phase === 'round_end' && (
            <div className="w-full">
              <h2 className="text-2xl font-black mb-4">Rundenende!</h2>
              <div className="flex flex-col gap-2 mb-6 text-left">
                {state.players.map(p => (
                  <div key={p.id} className="flex justify-between bg-slate-800 p-3 rounded-lg">
                    <span>{p.name}</span>
                    <span className="font-mono text-emerald-400">+{p.roundScore} Pkt</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => dispatch({ type: 'START_NEXT_ROUND' })}
                className="w-full py-4 bg-emerald-600 font-bold rounded-xl text-lg hover:bg-emerald-500 transition-colors"
              >
                Nächste Runde starten
              </button>
            </div>
          )}

          {state.phase === 'game_over' && (
            <div className="w-full">
              <h2 className="text-3xl font-black mb-6 text-yellow-500">SPIELENDE</h2>
              <div className="space-y-4 mb-8">
                {[...state.players].sort((a,b) => b.score - a.score).map((p, i) => (
                  <div key={p.id} className={`flex justify-between items-center bg-slate-800 p-4 rounded-xl ${i===0 ? 'border-2 border-yellow-500 scale-105' : ''}`}>
                    <span className="text-xl font-bold flex items-center gap-2">
                       {i === 0 && <Crown className="text-yellow-500" />} {p.name}
                    </span>
                    <span className="font-mono text-2xl font-black">{p.score}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => handleStartVersion(currentVersion)}
                className="w-full py-4 bg-slate-700 font-bold rounded-xl text-lg hover:bg-slate-600 transition-colors"
              >
                Neues Spiel
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
