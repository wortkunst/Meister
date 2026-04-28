import React, { useReducer, useState } from 'react';
import { motion } from 'motion/react';
import { gameReducer, initialState } from './reducer';
import { Card, Player, GameState } from './types';
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
};

const CardView = ({ card, isSecret, onClick, selectable }: { card: Card, isSecret?: boolean, onClick?: () => void, selectable?: boolean }) => {
  const formatCardType = (type: string) => {
    if (type === 'Hinterhalt!') return 'Hinter-\nhalt!';
    if (type === 'Schrottrüstung') return 'Schrott-\nRüstung';
    return type;
  };

  const cardExplanations: Record<string, string> = {
    'Käfig': 'Sperrt eine Karte ein und schützt sie.',
    'Hinterhalt!': 'Wirf eine Karte eines beliebigen Spielers ab.',
    'Schrottrüstung': 'Schützt dich einmalig vor dem Busten.',
    'Glitzerklunker': 'Bringt wertvolle Punkte.',
    'Von hinten geschubst': 'Du musst sofort eine weitere Karte ziehen.',
    'Lugloch': 'Du darfst die nächste Karte ansehen und entscheiden, ob du sie spielst.',
    'Geheimfach': 'Zieht eine verdeckte Karte, deren Wert erst am Ende zählt.',
    'Des Meisters Fluch': 'Bustet nicht bei Duplikaten. Zwei Flüche heben sich gegenseitig auf!',
    'Auswahlelixir': 'Ziehe 2 Karten und wähle eine davon aus.',
    'Dynamit': 'Bustet sofort!',
  };

  const tooltip = (
    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-48 bg-slate-900 text-slate-200 text-xs p-3 rounded-lg shadow-2xl border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[100] text-center hidden md:block">
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-[1px] border-4 border-transparent border-b-slate-700"></div>
      {cardExplanations[card.type]}
    </div>
  );

  if (isSecret) {
    return (
      <div 
        onClick={onClick}
        className={`w-40 md:w-48 aspect-[1050/1498] inline-block relative rounded-xl border overflow-hidden shadow-lg transition-transform hover:-translate-y-2 cursor-pointer ${selectable ? 'border-[3px] border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)] animate-pulse' : 'border-slate-800'}`}
      >
        <img src="/images/rueckseite.png" alt="Verdeckte Karte" className="absolute inset-0 w-full h-full object-cover" />
      </div>
    );
  }

  const colorScheme = typeColors[card.type] || { bg: 'bg-slate-800', text: 'text-slate-300', border: 'border-slate-600' };
  const borderColor = selectable ? 'border-[3px] border-yellow-400 cursor-pointer shadow-[0_0_15px_rgba(250,204,21,0.6)] animate-pulse' : colorScheme.border;
  const imageBorderClass = selectable ? 'border-[3px] border-yellow-400 cursor-pointer shadow-[0_0_15px_rgba(250,204,21,0.6)] animate-pulse' : 'border-transparent';
  
  const imageMap: Record<string, string> = {
    'Geheimfach': '/images/geheimfach-ohne-wert.png',
    'Glitzerklunker': '/images/glitzerklunker-ohne-wert.png',
    'Hinterhalt!': '/images/hinterhalt-kein-wert.png',
    'Lugloch': '/images/lugloch-kein-wert.png',
    'Schrottrüstung': '/images/ruestung-kein-wert.png',
    'Von hinten geschubst': '/images/schubs-ohne-wert.png',
    'Des Meisters Fluch': '/images/fluch-ohne-wert.png',
    'Dynamit': '/images/dynamit-ohne-wert.png',
    'Auswahlelixir': '/images/auswahlelixir-ohne-wert.png',
    'Käfig': '/images/kaefig-ohne-wert.png'
  };

  if (imageMap[card.type]) {
    const imgSrc = imageMap[card.type];
    return (
      <div className="group relative w-40 md:w-48 aspect-[1050/1498] inline-block">
        <div 
          onClick={onClick}
          className={`relative w-full h-full rounded-xl border flex flex-col items-center justify-between select-none ${imageBorderClass} shadow-md transition-transform duration-200 hover:-translate-y-2 overflow-hidden bg-black`}
        >
          <img src={imgSrc} alt={`${card.type} ${card.value}`} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute top-[2.5%] right-[2.5%] w-[22%] aspect-square flex items-center justify-center z-10">
              <span className="text-3xl md:text-4xl font-black text-[#d6b014] drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                  {card.value}
              </span>
          </div>
        </div>
        {!isSecret && tooltip}
      </div>
    );
  }

  const displayText = formatCardType(card.type);

  return (
    <div className="group relative w-40 md:w-48 aspect-[1050/1498] inline-block">
      <div 
        onClick={onClick}
        className={`relative w-full h-full ${colorScheme.bg} ${colorScheme.text} rounded-xl border flex flex-col items-center justify-between p-3 md:p-4 select-none ${borderColor} shadow-md transition-transform duration-200 hover:-translate-y-2`}
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
      {!isSecret && tooltip}
    </div>
  );
};

const BustCountdown = ({ onComplete }: { onComplete: () => void }) => {
  const [count, setCount] = useState(3);
  useEffect(() => {
    if (count > 0) {
      const timer = setTimeout(() => setCount(count - 1), 400);
      return () => clearTimeout(timer);
    } else {
      onComplete();
    }
  }, [count, onComplete]);

  if (count === 0) return null;

  return (
    <motion.div 
      key={count}
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: [1.5, 1], opacity: [1, 0] }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 flex items-center justify-center z-[100] pointer-events-none text-red-500 font-black text-9xl drop-shadow-[0_0_30px_rgba(0,0,0,0.9)]"
    >
      {count}
    </motion.div>
  );
};

import { useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { GameAction } from './reducer';
import { Link, Copy } from 'lucide-react';

export default function Game({ 
  currentVersion, 
  onSwitchVersion,
  roomCode,
  myUserId,
  userName,
  onExit
}: { 
  currentVersion: string, 
  onSwitchVersion: (v: string, players?: string[] | null) => void,
  roomCode: string,
  myUserId: string,
  userName: string,
  onExit: () => void
}) {
  const [state, setState] = useState<GameState>(initialState);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    if (state.phase === 'fluch_cancel_wait' && state.players[state.currentPlayerIndex]?.userId === myUserId) {
      const timer = setTimeout(() => {
        dispatch({ type: 'TRIGGER_FLUCH_ANIM' });
      }, 1000);
      return () => clearTimeout(timer);
    }
    if (state.phase === 'fluch_cancel_anim' && state.players[state.currentPlayerIndex]?.userId === myUserId) {
      const timer = setTimeout(() => {
        dispatch({ type: 'CLEANUP_FLUCH' });
      }, 1000);
      return () => clearTimeout(timer);
    }
    if (state.phase === 'bust_armor_wait' && state.players[state.currentPlayerIndex]?.userId === myUserId) {
      const timer = setTimeout(() => {
        dispatch({ type: 'TRIGGER_BUST_COUNTDOWN' });
      }, 1200);
      return () => clearTimeout(timer);
    }
    if (state.phase === 'bust_anim' && state.players[state.currentPlayerIndex]?.userId === myUserId) {
      const timer = setTimeout(() => {
        dispatch({ type: 'CLEANUP_BUST' });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [state.phase, state.players, state.currentPlayerIndex, myUserId]);

  useEffect(() => {
    if (!roomCode) return;
    const unsub = onSnapshot(doc(db, 'games', roomCode), (snapshot) => {
        if (snapshot.exists()) {
            setState(snapshot.data() as GameState);
        }
    }, (err) => {
        console.error("Firebase error", err);
        // Error handling schema compliance
        if(err.message && err.message.includes('permission')) {
             console.error(JSON.stringify({
                 error: "Missing or insufficient permissions.",
                 operationType: 'get',
                 path: `games/${roomCode}`,
                 authInfo: {
                     userId: myUserId,
                     email: 'anonymous',
                     emailVerified: false,
                     isAnonymous: true,
                     providerInfo: []
                 }
             }));
        }
    });
    return unsub;
  }, [roomCode, myUserId]);

  const dispatch = async (action: GameAction) => {
      // In a real P2P or client-authoritative game, the client calculates the new state and pushes it
      if (!roomCode) return;
      const newState = gameReducer(state, action);
      try {
          await setDoc(doc(db, 'games', roomCode), newState);
      } catch (err: any) {
          console.error("Failed to sync state", err);
      }
  };

  const handleStartGame = () => {
      dispatch({ type: 'START_GAME', payload: { players: state.players } });
  };

  const currentPlayer = state.players[state.currentPlayerIndex];
  const isMyTurn = currentPlayer?.userId === myUserId;
  const isHost = state.players[0]?.userId === myUserId;
  const isHinterhaltActive = state.phase === 'hinterhalt_decision';

  useEffect(() => {
    const imagesToPreload = [
      '/images/geheimfach-ohne-wert.png',
      '/images/glitzerklunker-ohne-wert.png',
      '/images/hinterhalt-kein-wert.png',
      '/images/lugloch-kein-wert.png',
      '/images/ruestung-kein-wert.png',
      '/images/schubs-ohne-wert.png',
      '/images/fluch-ohne-wert.png',
      '/images/dynamit-ohne-wert.png',
      '/images/auswahlelixir-ohne-wert.png',
      '/images/kaefig-ohne-wert.png',
      '/images/rueckseite.png'
    ];
    imagesToPreload.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  // Global Cursor Override for Hinterhalt
  useEffect(() => {
    if (isHinterhaltActive) {
      const style = document.createElement('style');
      style.id = 'hinterhalt-cursor';
      style.innerHTML = `* { cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><g transform="rotate(135 16 16)"><rect x="14.5" y="2" width="3" height="18" rx="1" fill="%23cc0000"/><polygon points="16,0 13,5 19,5" fill="%23ff0000"/><rect x="10" y="18" width="12" height="2.5" rx="1" fill="%23990000"/><rect x="15" y="20" width="2" height="8" rx="1" fill="%23660000"/><circle cx="16" cy="29" r="1.5" fill="%23660000"/></g></svg>') 4 4, pointer !important; }`;
      document.head.appendChild(style);
      return () => {
        const el = document.getElementById('hinterhalt-cursor');
        if (el) el.remove();
      };
    }
  }, [isHinterhaltActive]);

  useEffect(() => {
    if (state.phase === 'hinterhalt_anim') {
      const timer = setTimeout(() => {
        dispatch({ type: 'CLEANUP_HINTERHALT' });
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [state.phase]);

  if (state.phase === 'setup') {
      return (
          <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 flex flex-col items-center justify-center font-sans relative overflow-hidden bg-mesh-gradient">
        <div className="relative z-10 max-w-2xl w-full bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl shadow-2xl flex flex-col items-center">
                  <h1 className="text-4xl font-bold tracking-tighter bg-gradient-to-br from-emerald-400 to-cyan-500 bg-clip-text text-transparent mb-2">Lobby</h1>
                  <p className="text-slate-400 text-lg mb-8">Raum-Code: <span className="font-mono text-white bg-slate-800 px-3 py-1 rounded font-bold tracking-widest">{roomCode}</span></p>

                  <div className="bg-slate-950/50 w-full p-4 rounded-xl border border-slate-800 mb-8 flex items-center justify-between">
                     <span className="text-slate-400 text-sm truncate mr-2">
                        {window.location.origin}{window.location.pathname}?room={roomCode}
                     </span>
                     <button 
                        onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?room=${roomCode}`);
                            setLinkCopied(true);
                            setTimeout(() => setLinkCopied(false), 2000);
                        }}
                        className="p-2 bg-slate-800 hover:bg-slate-700 rounded transition-colors text-white flex-shrink-0"
                     >
                         {linkCopied ? <span className="text-xs text-emerald-400 font-bold">Kopiert!</span> : <Copy size={16} />}
                     </button>
                  </div>

                  <div className="space-y-3 mb-8 text-left">
                      {state.players.map((p, i) => (
                          <div key={i} className="flex justify-between bg-slate-800 p-3 rounded-xl border border-slate-700">
                             <div className="flex items-center gap-3">
                                 {p.userId === state.players[0]?.userId && <Crown size={16} className="text-yellow-500" />}
                                 <span className="font-bold">{p.name}</span>
                             </div>
                             {p.userId === myUserId && <span className="text-xs text-emerald-400 bg-emerald-400/20 px-2 py-1 rounded">Du</span>}
                          </div>
                      ))}
                      {state.players.length < 4 && (
                          <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 border-dashed text-slate-500 text-center">
                             Warten auf Mitspieler...
                          </div>
                      )}
                  </div>

                  {state.players[0]?.userId === myUserId ? (
                      <button
                        onClick={handleStartGame}
                        disabled={state.players.length < 2}
                        className="w-full py-4 bg-gradient-to-b from-emerald-400 to-emerald-600 text-white font-black rounded-2xl text-xl shadow-[0_5px_0_rgb(4,120,87),0_10px_20px_rgba(0,0,0,0.5)] active:shadow-none active:translate-y-[5px] hover:brightness-110 transition-all uppercase tracking-wider disabled:opacity-50"
                      >
                        Spiel starten
                      </button>
                  ) : (
                      <button disabled className="w-full py-4 bg-slate-700 font-bold rounded-xl text-lg text-slate-400 shadow-lg cursor-not-allowed">
                        Warten auf Host...
                      </button>
                  )}
              </div>
          </div>
      );
  }

  return (
    <div 
      className="min-h-screen bg-slate-950 text-white font-sans flex flex-col items-center pt-2 pb-24 relative overflow-hidden bg-mesh-gradient"
    >
      <div className="relative z-10 w-full max-w-full px-2 lg:px-4 flex justify-between items-center mb-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-emerald-400">V2.0 CAPTAIN FLIP</h1>
          <p className="text-sm text-slate-400">Runde {state.round}</p>
        </div>
        <div className="flex gap-6">
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="block text-[10px] text-slate-500 uppercase tracking-widest font-bold">Deck</span>
              <span className="font-mono text-xl text-slate-300 font-black drop-shadow-md">{state.deck.length}</span>
            </div>
            <div className="relative w-8 md:w-10 aspect-[1050/1498] rounded-md shadow-[0_4px_10px_rgba(0,0,0,0.5)] overflow-hidden border border-slate-700 transform rotate-[4deg]">
              <img src="/images/rueckseite.png" alt="Deck" className="absolute inset-0 w-full h-full object-cover" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="block text-[10px] text-slate-500 uppercase tracking-widest font-bold">Ablage</span>
              <span className="font-mono text-xl text-slate-400 font-black drop-shadow-md">{state.discardPile.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-full px-2 lg:px-4 flex flex-wrap justify-center gap-2 mb-4">
        {state.players.map(p => (
          <div key={p.id} className={`relative flex-1 min-w-[350px] 2xl:min-w-[500px] p-3 md:p-4 rounded-xl border-2 transition-all duration-300 ${p.id === currentPlayer?.id ? 'border-emerald-400 bg-emerald-900/30 shadow-[0_0_20px_rgba(52,211,153,0.3)]' : 'border-slate-800 bg-slate-900/50'} ${p.status === 'BUSTED' ? 'opacity-50' : ''}`}>
            {state.phase === 'bust_wait' && p.id === currentPlayer?.id && (
               <BustCountdown onComplete={() => {
                  if (isMyTurn) dispatch({ type: 'TRIGGER_BUST' });
               }} />
            )}
            <div className="flex justify-between items-center mb-2">
              <div>
                <h3 className="font-bold text-lg">{p.name}</h3>
                <span className="text-xs text-slate-400">{p.status}</span>
              </div>
              <div className="flex gap-6 text-center">
                <div className="flex flex-col items-center justify-end">
                  <div className="text-2xl font-black font-mono text-emerald-400 drop-shadow-md">
                     {p.status === 'BUSTED' ? 0 : 
                        p.display.filter(i => !i.isBusted && !i.isSecret).reduce((sum, i) => sum + i.card.value + (i.cagedBy ? i.cagedBy.value : 0), 0)
                     }
                     {p.display.some(i => i.isSecret && !i.isBusted) && p.status !== 'BUSTED' ? ' + ?' : ''}
                  </div>
                  <div className="text-[10px] font-bold tracking-widest text-emerald-600/70 uppercase">Runde</div>
                </div>
                <div className="flex flex-col items-center justify-end">
                  <div className="text-2xl font-black font-mono text-white drop-shadow-md">{p.score}</div>
                  <div className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Gesamt</div>
                </div>
              </div>
            </div>
            
            <div className={`flex overflow-x-auto overflow-y-visible pb-24 pt-2 px-2 items-start min-h-[250px] md:min-h-[300px] custom-scrollbar w-full transition-all duration-700 ${p.status === 'STOPPED' ? 'grayscale-[60%] opacity-80' : ''}`} style={{ gap: '0.5rem' }}>
              {p.display.map((item, idx) => {
                const opponentsHaveCards = state.players.some(pl => pl.id !== currentPlayer?.id && pl.status === 'PLAYING' && pl.display.length > 0);
                const canTargetWithHinterhalt = p.status === 'PLAYING'; // Anyone playing can be targeted
                
                const isHinterhaltTargetableBase = isMyTurn && state.phase === 'hinterhalt_decision' && canTargetWithHinterhalt && !item.cagedBy && item.card.id !== state.pendingActionCard?.id;
                const isHinterhaltTargetableCage = isMyTurn && state.phase === 'hinterhalt_decision' && canTargetWithHinterhalt && !!item.cagedBy && item.cagedBy.id !== state.pendingActionCard?.id;
                const isCageTargetable = isMyTurn && state.phase === 'cage_decision' && p.id === currentPlayer?.id && !item.cagedBy && (item.isSecret || item.card.type !== 'Käfig');
                const selectable = isCageTargetable || isHinterhaltTargetableBase;
                
                let animInitial: any = { opacity: 0, x: 200, y: -400, scale: 0.2, rotate: 45, filter: 'grayscale(0%) opacity(1)' };
                let animAnimate: any = { opacity: 1, x: 0, y: 0, scale: 1, rotate: 0, filter: 'grayscale(0%) opacity(1)' };
                let animTransition: any = { type: 'spring', stiffness: 260, damping: 20 };

                if (item.isBusted) {
                    const isEven = idx % 2 === 0;
                    animAnimate = {
                          filter: [
                              'sepia(100%) hue-rotate(-50deg) saturate(500%) opacity(1) drop-shadow(0px 0px 30px red)', 
                              'grayscale(100%) opacity(0)'
                          ],
                          y: [0, 60],
                          x: [0, isEven ? -30 : 30],
                          rotate: [0, isEven ? -90 : 90],
                          scale: [1, 0.6],
                          opacity: [1, 0]
                      };
                      animTransition = { duration: 0.8, ease: "easeIn" };
                } else if (item.isEvaluated) {
                    animAnimate = {
                          ...animAnimate,
                          filter: [
                              'grayscale(0%) opacity(1)', 
                              'grayscale(100%) opacity(0.8)'
                          ]
                      };
                      animTransition = { duration: 0.8, ease: "easeInOut" };
                } else if (item.isHinterhaltDestroyed) {
                    animInitial = { opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 };
                    animAnimate = {
                          opacity: [1, 1, 0],
                          scale: [1, 1.1, 0.8],
                          rotate: [0, 5, -5],
                          filter: [
                              'grayscale(0%) brightness(1)',
                              'grayscale(0%) brightness(2) drop-shadow(0px 0px 20px red)',
                              'grayscale(100%) brightness(0.5)'
                          ]
                      };
                      animTransition = { duration: 1.0, ease: "easeInOut" };
                } else if (item.isFluchCanceled) {
                    animAnimate = {
                          filter: [
                              'grayscale(0%) opacity(1)', 
                              'sepia(100%) hue-rotate(90deg) saturate(500%) opacity(1) drop-shadow(0px 0px 30px purple)', 
                              'grayscale(100%) opacity(0)'
                          ],
                          scale: [1, 1.2, 0],
                          rotate: [0, 15, -15, 0],
                          opacity: [1, 1, 0]
                      };
                      animTransition = { duration: 0.8, ease: "easeInOut" };
                }

                return (
                  <div key={item.id} className="group relative transition-all shrink-0" style={{ zIndex: p.display.length - idx }}>
                    <motion.div
                      initial={animInitial}
                      animate={animAnimate}
                      transition={animTransition}
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
                            <motion.div 
                               initial={{ scale: 0, opacity: 1 }}
                               animate={{ scale: [0, 2, 4], opacity: [1, 1, 0] }}
                               transition={{ duration: 0.6, ease: "easeOut" }}
                               className="absolute inset-0 flex items-center justify-center pointer-events-none z-50 text-[5rem]"
                            >
                                💥
                            </motion.div>
                      )}
                      {item.isHinterhaltDestroyed && (
                          <>
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: [0, 1, 1, 0], scale: [0.5, 1.2, 1.2, 0.5] }}
                              transition={{ duration: 1.0, ease: "easeOut" }}
                              className="absolute inset-0 flex items-center justify-center pointer-events-none z-50 text-[4rem]"
                            >
                              🗡️
                            </motion.div>
                            <motion.div
                              className="absolute inset-0 pointer-events-none z-40"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: [0, 0.8, 0] }}
                              transition={{ duration: 1.0 }}
                            >
                              <div className="absolute top-0 left-0 w-full h-1/2 overflow-hidden">
                                <motion.div
                                  className="w-full h-[200%] bg-red-500/30 rounded-xl"
                                  initial={{ y: 0 }}
                                  animate={{ y: [0, -20, -80] }}
                                  transition={{ duration: 1.0, ease: "easeIn" }}
                                />
                              </div>
                              <div className="absolute bottom-0 left-0 w-full h-1/2 overflow-hidden">
                                <motion.div
                                  className="w-full h-[200%] bg-red-500/30 rounded-xl"
                                  style={{ marginTop: '-100%' }}
                                  initial={{ y: 0 }}
                                  animate={{ y: [0, 20, 80] }}
                                  transition={{ duration: 1.0, ease: "easeIn" }}
                                />
                              </div>
                            </motion.div>
                          </>
                      )}
                      {item.cagedBy && (
                        <div className={`absolute top-10 -right-4 md:top-14 md:-right-6 z-20 ${item.isBusted ? 'grayscale opacity-50' : 'opacity-60 hover:opacity-80 transition-opacity'}`}>
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
                    </motion.div>
                    {!item.cagedBy && isCageTargetable && (
                      <div className="absolute top-10 -right-4 md:top-14 md:-right-6 z-20 opacity-40 pointer-events-none group-hover:opacity-80 transition-all transform scale-50 origin-center drop-shadow-2xl">
                        <CardView card={{ id: 'preview', type: 'Käfig', value: 0 }} />
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

      <div className="relative z-10 w-full max-w-full px-2 lg:px-4 mb-20">
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
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-md border-t border-slate-800 p-6 flex justify-center z-50">
        <div className="max-w-2xl w-full text-center">
          
          {(() => {
            const hasElixir = currentPlayer && currentPlayer.display.length > 0 && 
              currentPlayer.display[currentPlayer.display.length - 1].card.type === 'Auswahlelixir' &&
              !currentPlayer.display[currentPlayer.display.length - 1].cagedBy &&
              !currentPlayer.display[currentPlayer.display.length - 1].isSecret &&
              !currentPlayer.display[currentPlayer.display.length - 1].elixirUsed;

            return state.phase === 'playing' && currentPlayer && currentPlayer.status === 'PLAYING' && isMyTurn && (
              <div className="flex gap-4">
                <button
                  onClick={() => dispatch({ type: 'DRAW_CARD' })}
                  className="flex-1 py-4 bg-gradient-to-b from-emerald-400 to-emerald-600 text-white font-black rounded-2xl text-xl shadow-[0_5px_0_rgb(4,120,87),0_10px_20px_rgba(0,0,0,0.5)] active:shadow-[0_0px_0_rgb(4,120,87),0_0px_0_rgba(0,0,0,0.5)] active:translate-y-[5px] hover:brightness-110 transition-all uppercase tracking-wider"
                >
                  {hasElixir ? 'Karten ziehen' : 'Karte ziehen'}
                </button>
                {currentPlayer.display.length > 0 && (
                  <button
                    onClick={() => dispatch({ type: 'STOP' })}
                    className="flex-1 py-4 bg-gradient-to-b from-red-500 to-red-700 text-white font-black rounded-2xl text-xl shadow-[0_5px_0_rgb(153,27,27),0_10px_20px_rgba(0,0,0,0.5)] active:shadow-[0_0px_0_rgb(153,27,27),0_0px_0_rgba(0,0,0,0.5)] active:translate-y-[5px] hover:brightness-110 transition-all uppercase tracking-wider"
                  >
                    Hör auf!
                  </button>
                )}
              </div>
            );
          })()}

          {state.phase === 'geheimfach_decision' && currentPlayer && currentPlayer.status === 'PLAYING' && isMyTurn && (
             <div className="flex flex-col items-center">
                <span className="text-indigo-400 font-bold mb-2 uppercase tracking-widest text-sm">Geheimfach gespielt!</span>
                <p className="text-sm text-slate-400 mb-4">Du hast ein Geheimfach. Ziehe nun den Inhalt verdeckt heraus.</p>
                <div className="flex gap-4 w-full">
                  <button onClick={() => dispatch({ type: 'DRAW_SECRET_CARD' })} className="flex-1 py-4 bg-gradient-to-b from-indigo-500 to-indigo-700 text-white font-black rounded-2xl text-xl shadow-[0_5px_0_rgb(67,56,202),0_10px_20px_rgba(0,0,0,0.5)] active:shadow-none active:translate-y-[5px] hover:brightness-110 transition-all uppercase tracking-wider">Geheimkarte ziehen</button>
                </div>
             </div>
          )}

          {state.phase === 'geschubst_decision' && currentPlayer && currentPlayer.status === 'PLAYING' && isMyTurn && (
             <div className="flex flex-col items-center">
                <span className="text-orange-400 font-bold mb-2 uppercase tracking-widest text-sm">Von hinten geschubst!</span>
                <p className="text-sm text-slate-400 mb-4">Du wurdest geschubst und musst sofort weiterziehen!</p>
                <div className="flex gap-4 w-full">
                  <button onClick={() => dispatch({ type: 'DRAW_CARD' })} className="flex-1 py-4 bg-gradient-to-b from-emerald-400 to-emerald-600 text-white font-black rounded-2xl text-xl shadow-[0_5px_0_rgb(4,120,87),0_10px_20px_rgba(0,0,0,0.5)] active:shadow-none active:translate-y-[5px] hover:brightness-110 transition-all uppercase tracking-wider">Karte ziehen</button>
                </div>
             </div>
          )}

          {state.phase === 'lugloch_decision' && state.pendingCards.length === 1 && isMyTurn && (
             <div className="flex flex-col items-center">
                <span className="text-yellow-400 mb-8 font-black uppercase tracking-widest text-sm drop-shadow-md z-10">Lugloch: Angesehene Karte</span>
                <div className="mb-8 transform scale-110 opacity-80 hover:opacity-100 transition-opacity drop-shadow-2xl">
                   <CardView card={state.pendingCards[0]} />
                </div>
                <div className="flex gap-4 w-full z-10">
                  <button onClick={() => dispatch({ type: 'LUGLOCH_PLAY' })} className="flex-1 py-3 bg-gradient-to-b from-emerald-400 to-emerald-600 text-white font-black rounded-xl shadow-[0_4px_0_rgb(4,120,87)] active:shadow-none active:translate-y-[4px] transition-all uppercase tracking-wider">Spielen</button>
                  <button onClick={() => dispatch({ type: 'LUGLOCH_RETURN' })} className="flex-1 py-3 bg-gradient-to-b from-slate-600 to-slate-800 text-white font-black rounded-xl shadow-[0_4px_0_rgb(30,41,59)] active:shadow-none active:translate-y-[4px] transition-all uppercase tracking-wider">Zurücklegen</button>
                </div>
             </div>
          )}

          {state.phase === 'elixir_decision' && state.pendingCards.length === 2 && isMyTurn && (
             <div className="flex flex-col items-center w-full">
                <span className="text-indigo-400 mb-4 font-bold uppercase tracking-widest text-sm">Auswahlelixir: Wähle eine Karte</span>
                <div className="flex gap-8 mb-6">
                   <div onClick={() => dispatch({ type: 'ELIXIR_CHOOSE', payload: { index: 0 } })} className="cursor-pointer hover:scale-105 transition-transform"><CardView card={state.pendingCards[0]} selectable /></div>
                   <div onClick={() => dispatch({ type: 'ELIXIR_CHOOSE', payload: { index: 1 } })} className="cursor-pointer hover:scale-105 transition-transform"><CardView card={state.pendingCards[1]} selectable /></div>
                </div>
             </div>
          )}

          {state.phase === 'cage_decision' && isMyTurn && (
             <div>
                <span className="text-orange-400 font-bold text-lg">Käfig gespielt!</span>
                <p className="text-sm text-slate-400 mt-2">Wähle eine Karte in deiner Auslage, um sie einzusperren.</p>
             </div>
          )}

          {state.phase === 'hinterhalt_decision' && isMyTurn && (
             <div>
                <span className="text-orange-400 font-bold text-lg">Hinterhalt! gespielt!</span>
                <p className="text-sm text-slate-400 mt-2">Klicke auf die Karte eines Ziels (gelb umrandet), um sie abzuwerfen.</p>
             </div>
          )}

          {!isMyTurn && state.phase !== 'setup' && state.phase !== 'round_end' && state.phase !== 'game_over' && (
              <div className="text-slate-400 py-4 font-medium animate-pulse">
                  Warte auf den Zug von <span className="font-bold text-white">{currentPlayer?.name}</span>...
              </div>
          )}

          {state.phase === 'round_end' && (
            <div className="w-full">
              <h2 className="text-2xl font-black mb-4">Rundenende!</h2>
              <div className="flex flex-col gap-2 mb-6 text-left">
                {state.players.map(p => (
                  <div key={p.id} className="flex justify-between bg-slate-800 p-3 rounded-lg">
                    <span>{p.name}</span>
                    <span className="font-mono text-emerald-400 text-xl font-black">+{p.roundScore} Pkt</span>
                  </div>
                ))}
              </div>
              {isMyTurn && (
                <button
                  onClick={() => dispatch({ type: 'START_NEXT_ROUND' })}
                  className="w-full py-4 bg-gradient-to-b from-emerald-400 to-emerald-600 text-white font-black rounded-2xl text-xl shadow-[0_5px_0_rgb(4,120,87),0_10px_20px_rgba(0,0,0,0.5)] active:shadow-[0_0px_0_rgb(4,120,87),0_0px_0_rgba(0,0,0,0.5)] active:translate-y-[5px] hover:brightness-110 transition-all uppercase tracking-wider"
                >
                  Nächste Runde starten
                </button>
              )}
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
                onClick={onExit}
                className="w-full py-4 bg-gradient-to-b from-slate-500 to-slate-700 text-white font-black rounded-2xl text-xl shadow-[0_5px_0_rgb(51,65,85),0_10px_20px_rgba(0,0,0,0.5)] active:shadow-[0_0px_0_rgb(51,65,85),0_0px_0_rgba(0,0,0,0.5)] active:translate-y-[5px] hover:brightness-110 transition-all uppercase tracking-wider"
              >
                Zur Lobby zurückkehren
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
