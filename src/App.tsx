import React, { useState, useEffect } from 'react';
import GameV1_0 from './v1_0/Game';
import GameV1_1 from './v1_1/Game';
import GameV2_0 from './v2_0/Game';
import GameV3_0 from './v3_0/Game';
import { GameState as GameStateV3 } from './v3_0/types';
import { initialState as initialStateV3 } from './v3_0/reducer';
import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';

export default function App() {
  const [gameMode, setGameMode] = useState<'local' | 'multiplayer'>('local');
  const [localVersion, setLocalVersion] = useState('v1_0');
  
  // Local state
  const [localPlayers, setLocalPlayers] = useState(['Spieler 1', 'Spieler 2', '', '']);
  
  // Multiplayer state
  const [myUserId] = useState(() => {
      let uid = localStorage.getItem('cf_user_id');
      if (!uid) { uid = Math.random().toString(36).substring(2, 10); localStorage.setItem('cf_user_id', uid); }
      return uid;
  });
  const [userName, setUserName] = useState(() => localStorage.getItem('cf_user_name') || '');
  const [joinCode, setJoinCode] = useState('');
  const [activeRoomCode, setActiveRoomCode] = useState<string | null>(null);

  const [isGameStarted, setIsGameStarted] = useState(false);
  const [activeVersion, setActiveVersion] = useState('v3_0');
  const [persistedPlayers, setPersistedPlayers] = useState<string[] | null>(null);

  useEffect(() => {
      localStorage.setItem('cf_user_name', userName);
  }, [userName]);

  useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const room = params.get('room');
      if (room) {
          setJoinCode(room.toUpperCase());
          setGameMode('multiplayer');
      }
  }, []);

  const handleStartLocal = () => {
    const validPlayers = localPlayers.filter(n => n.trim() !== '');
    if (validPlayers.length >= 2) {
      setActiveVersion(localVersion);
      setPersistedPlayers(validPlayers);
      setIsGameStarted(true);
    } else {
      alert("Es werden mindestens 2 Spieler benötigt.");
    }
  };

  const handleCreateMultiplayer = async () => {
      if (!userName.trim()) return;
      const code = Math.random().toString(36).substring(2, 6).toUpperCase();
      const st = {
          ...initialStateV3,
          players: [{ id: 0, name: userName, userId: myUserId, score: 0, roundScore: 0, display: [], status: 'PLAYING' }]
      };
      await setDoc(doc(db, 'games', code), st);
      setActiveRoomCode(code);
      setActiveVersion('v3_0');
      setIsGameStarted(true);
      window.history.replaceState(null, '', `?room=${code}`);
  };

  const handleJoinMultiplayer = async () => {
      if (!userName.trim() || !joinCode.trim()) return;
      const code = joinCode.toUpperCase();
      const snapshot = await getDoc(doc(db, 'games', code));
      if (snapshot.exists()) {
          const data = snapshot.data() as GameStateV3;
          if (data.phase !== 'setup') {
              alert("Spiel läuft bereits.");
              return;
          }
          if (data.players.length >= 4) {
              alert("Spiel ist voll.");
              return;
          }
          if (!data.players.some(p => p.userId === myUserId)) {
              const newPlayer = {
                  id: data.players.length,
                  name: userName,
                  userId: myUserId,
                  score: 0,
                  roundScore: 0,
                  display: [],
                  status: 'PLAYING'
              };
              await updateDoc(doc(db, 'games', code), {
                  players: arrayUnion(newPlayer)
              });
          }
          setActiveRoomCode(code);
          setActiveVersion('v3_0');
          setIsGameStarted(true);
          window.history.replaceState(null, '', `?room=${code}`);
      } else {
          alert("Lobby nicht gefunden.");
      }
  };

  const handleExitGame = () => {
    setIsGameStarted(false);
    setActiveRoomCode(null);
    setPersistedPlayers(null);
    window.history.replaceState(null, '', window.location.pathname);
  };

  // Switch versions logic is now handled internally by exiting to lobby, except when forced directly.
  const handleSwitchVersion = (v: string, players?: string[] | null) => {
    if (!players || players.length < 2) {
      handleExitGame(); // Go back to lobby if no players specified to start immediately.
    } else {
      setActiveVersion(v);
      setPersistedPlayers(players);
      setIsGameStarted(true);
    }
  };

  if (!isGameStarted) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-8 flex flex-col items-center justify-center font-sans tracking-wide">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl">
          <h1 className="text-4xl font-black text-center mb-8 bg-gradient-to-br from-emerald-400 to-cyan-500 bg-clip-text text-transparent">Spiele-Lobby</h1>
          
          <div className="flex bg-slate-800 p-1 rounded-xl mb-8">
            <button
              onClick={() => setGameMode('local')}
              className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${gameMode === 'local' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Lokal (Ein Gerät)
            </button>
            <button
              onClick={() => setGameMode('multiplayer')}
              className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${gameMode === 'multiplayer' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Multiplayer (Online)
            </button>
          </div>

          {gameMode === 'local' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Version auswählen</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'v1_0', label: 'Basis' },
                    { id: 'v1_1', label: 'Push It' },
                    { id: 'v2_0', label: 'Captain Flip' }
                  ].map(v => (
                    <button
                      key={v.id}
                      onClick={() => setLocalVersion(v.id)}
                      className={`py-3 text-xs md:text-sm font-bold rounded-xl border transition-all ${localVersion === v.id ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:bg-slate-700'}`}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                 <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Spieler (mindestens 2)</label>
                {localPlayers.map((name, i) => (
                  <input
                    key={i}
                    type="text"
                    value={name}
                    onChange={(e) => {
                      const newNames = [...localPlayers];
                      newNames[i] = e.target.value;
                      setLocalPlayers(newNames);
                    }}
                    placeholder={`Name Spieler ${i + 1} ${i >= 2 ? '(Optional)' : ''}`}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium"
                  />
                ))}
              </div>

              <button
                onClick={handleStartLocal}
                className="w-full py-4 mt-4 bg-emerald-600 text-white font-black uppercase tracking-widest rounded-xl hover:bg-emerald-500 focus:ring-4 focus:ring-emerald-500/50 transition-all active:scale-95"
              >
                Lokal Starten
              </button>
            </div>
          )}

          {gameMode === 'multiplayer' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
               <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Version</label>
                <div className="w-full py-3 px-4 text-sm font-bold rounded-xl border bg-emerald-600/10 border-emerald-500/30 text-emerald-400">
                  Version 3.0 (Netzwerk)
                </div>
              </div>

              <div className="space-y-4">
                 <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1 block">Dein Name</label>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Dein Name"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium text-white"
                    />
                 </div>
                 
                 <div className="pt-2">
                    <button
                      onClick={handleCreateMultiplayer}
                      className="w-full py-4 bg-slate-800 border-2 border-emerald-600 text-emerald-400 font-bold uppercase tracking-wider rounded-xl hover:bg-emerald-600 hover:text-white focus:ring-4 focus:ring-emerald-500/50 transition-all active:scale-95 mb-4"
                    >
                      Neuen Raum Hosten
                    </button>
                    
                    <div className="relative flex items-center py-2">
                        <div className="flex-grow border-t border-slate-700"></div>
                        <span className="flex-shrink-0 mx-4 text-slate-500 text-xs font-bold uppercase">Oder Beitreten</span>
                        <div className="flex-grow border-t border-slate-700"></div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <input
                        type="text"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        placeholder="Zimmer-Code"
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-bold text-white text-center tracking-[0.2em] uppercase"
                      />
                      <button
                        onClick={handleJoinMultiplayer}
                        className="px-6 bg-cyan-600 text-white font-bold uppercase tracking-wider rounded-xl hover:bg-cyan-500 focus:ring-4 focus:ring-cyan-500/50 transition-all active:scale-95"
                      >
                        Beitreten
                      </button>
                    </div>
                 </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      {activeVersion === 'v1_0' && <GameV1_0 onSwitchVersion={handleSwitchVersion} currentVersion={activeVersion} initialPlayers={persistedPlayers} />}
      {activeVersion === 'v1_1' && <GameV1_1 onSwitchVersion={handleSwitchVersion} currentVersion={activeVersion} initialPlayers={persistedPlayers} />}
      {activeVersion === 'v2_0' && <GameV2_0 onSwitchVersion={handleSwitchVersion} currentVersion={activeVersion} initialPlayers={persistedPlayers} />}
      {activeVersion === 'v3_0' && <GameV3_0 onSwitchVersion={handleSwitchVersion} currentVersion={activeVersion} roomCode={activeRoomCode!} myUserId={myUserId} userName={userName} onExit={handleExitGame} />}
    </>
  );
}
