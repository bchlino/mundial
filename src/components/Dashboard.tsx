import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../lib/AuthContext';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import { doc, onSnapshot, collection, getDoc, updateDoc } from 'firebase/firestore';
import { WORLD_CUP_TEAMS, Team } from '../lib/teams';
import { MatchResult, getMatchPoints } from '../lib/results';
import { fetchResultsFromGist } from '../lib/resultsSource';
import { motion } from 'motion/react';
import { Trophy, Star, Users, LayoutGrid, Info, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import { useLanguage } from '../lib/LanguageContext';

interface LeagueData {
  id: string;
  name: string;
  adminId: string;
  status: string;
  participants: string[];
   picksRevealAt?: { toDate?: () => Date } | null;
}

export const Dashboard: React.FC<{ league: LeagueData }> = ({ league }) => {
  const { user } = useAuth();
   const { tr } = useLanguage();
  const [picks, setPicks] = useState<Record<string, any>>({});
  const [users, setUsers] = useState<Record<string, any>>({});
   const [view, setView] = useState<'grid' | 'table'>('grid');
   const [results, setResults] = useState<MatchResult[]>([]);
   const [resultsLoadError, setResultsLoadError] = useState<string | null>(null);

   // Resultados oficiales desde gist (sin dependencia de /matches en Firestore)
   useEffect(() => {
      let isMounted = true;
      const refreshMs = Number(import.meta.env.VITE_RESULTS_REFRESH_MS || 300000);

      const loadResults = async () => {
         try {
            const { matches } = await fetchResultsFromGist();
            if (!isMounted) return;
            setResults(matches);
            setResultsLoadError(null);
         } catch (error) {
            if (!isMounted) return;
            console.error('Failed to load gist results:', error);
            setResults([]);
            setResultsLoadError(tr('No se pudieron cargar los resultados del Gist.', 'Could not load results from Gist.'));
         }
      };

      void loadResults();
      const timer = Number.isFinite(refreshMs) && refreshMs > 0
        ? window.setInterval(() => {
            void loadResults();
          }, refreshMs)
        : null;

      return () => {
         isMounted = false;
         if (timer) {
            window.clearInterval(timer);
         }
      };
   }, [tr]);

  useEffect(() => {
    const unsubPicks = onSnapshot(collection(db, 'leagues', league.id, 'picks'), (snap) => {
      const p: Record<string, any> = {};
      snap.forEach(doc => p[doc.id] = doc.data());
      setPicks(p);
    });

    // Subscribirse a los perfiles de los participantes para cambios en tiempo real
    const unsubUsers = league.participants.map(uid => {
      return onSnapshot(doc(db, 'users', uid), (snap) => {
        if (snap.exists()) {
          setUsers(prev => ({ ...prev, [uid]: snap.data() }));
        } else {
          setUsers(prev => ({ 
            ...prev, 
            [uid]: { displayName: 'Jugador Anónimo', photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}` } 
          }));
        }
      });
    });

    return () => {
      unsubPicks();
      unsubUsers.forEach(unsub => unsub());
    };
  }, [league.id, league.participants]);

   const myPicks = picks[user?.uid || ''];
   const myTeams = WORLD_CUP_TEAMS.filter(t => myPicks?.teamIds?.includes(t.id));

   // Calcula puntos para un equipo
   function calcTeamPoints(teamId: string, tapadoId?: string) {
      let pts = results.reduce((acc, match) => acc + getMatchPoints(teamId, match), 0);
      // Tapado: duplica puntos en KO, penaliza si eliminado
      if (tapadoId && teamId === tapadoId) {
         let tapadoPts = 0;
         let eliminado = false;
         for (const match of results) {
            if (match.stage !== 'groups' && (match.homeTeam === teamId || match.awayTeam === teamId)) {
               const win = getMatchPoints(teamId, match) > 0;
               if (win) tapadoPts += getMatchPoints(teamId, match); // suma normal
               else eliminado = true;
            }
         }
         pts += tapadoPts; // duplica KO
         if (eliminado) pts -= 5;
      }
      return pts;
   }

   // Calcula puntos totales de usuario
   function calcUserPoints(userId: string) {
      const userPicks = picks[userId];
      if (!userPicks?.teamIds) return 0;
      return userPicks.teamIds.reduce((acc: number, tid: string) => acc + calcTeamPoints(tid, userPicks.tapadoId), 0);
   }

   const leaderboard = useMemo(() => {
      return [...league.participants]
         .map((uid) => ({
            uid,
            points: calcUserPoints(uid),
            displayName: users[uid]?.displayName || 'Jugador Anonimo',
         }))
         .sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            return String(a.displayName).localeCompare(String(b.displayName));
         });
   }, [league.participants, picks, users, results]);

   const participantsReadyCount = useMemo(() => {
      return league.participants.filter((uid) => (picks[uid]?.teamIds || []).length === 4).length;
   }, [league.participants, picks]);

   const picksRevealAtDate = league.picksRevealAt?.toDate?.() ?? null;
   const picksArePublished = picksRevealAtDate ? Date.now() >= picksRevealAtDate.getTime() : false;

   const hideOpponentTeams = !picksArePublished;

  const handleSetTapado = async (teamId: string) => {
    if (!user) return;
      if (picksArePublished) return;
    try {
      await updateDoc(doc(db, 'leagues', league.id, 'picks', user.uid), {
        tapadoId: teamId
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `leagues/${league.id}/picks/${user.uid}`);
    }
  };

  return (
   <div className="space-y-10 sm:space-y-16">
      {/* My Team Section */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 sm:mb-12 pb-4 sm:pb-6 border-b-4 border-black gap-4">
           <div className="flex items-baseline gap-3 sm:gap-6">
              <h2 className="text-4xl sm:text-6xl font-serif font-black italic uppercase tracking-tighter">Mi Plantilla</h2>
              <p className="text-xs font-black uppercase tracking-[0.4em] opacity-40 hidden sm:block">{tr('Seleccion confirmada', 'Confirmed selection')}</p>
           </div>
           
           {!myPicks?.tapadoId && myTeams.length === 4 && (
             <div className="bg-[#FF3E00] text-white px-4 py-2 text-[10px] font-black uppercase tracking-widest animate-pulse">
                        {tr('Seleccion pendiente: marca tu tapado', 'Selection pending: mark your wildcard')} ⭐
             </div>
           )}
        </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 sm:gap-8">
           {myTeams.map(team => (
             <motion.div 
               key={team.id}
               className={cn(
                         "relative p-5 sm:p-8 border-4 transition-all flex flex-col group min-h-72 sm:min-h-80",
                 myPicks?.tapadoId === team.id 
                  ? "bg-black text-white border-black shadow-[12px_12px_0px_0px_rgba(255,62,0,1)]" 
                  : "bg-white border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
               )}
             >
               <div className="absolute -top-4 -left-4 bg-black text-white border-2 border-white w-10 h-10 flex items-center justify-center font-serif italic text-xl group-hover:bg-[#FF3E00] transition-colors">
                  {team.pot}
               </div>

               <div className="text-6xl mb-8 group-hover:scale-110 transition-transform origin-left">{team.flag}</div>
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1 block">{tr('Nivel nacional', 'National tier')}</span>
               <h3 className="text-3xl sm:text-4xl font-serif italic font-black uppercase mb-8 leading-none wrap-break-word">{team.name}</h3>
               
               <div className="mt-auto pt-6 border-t-2 border-black/10">
                 <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest mb-4">
                              <span className="opacity-40">{tr('Puntos acumulados', 'Accrued points')}</span>
                    <span className={cn(myPicks?.tapadoId === team.id ? "text-[#FF3E00]" : "text-black")}>{calcTeamPoints(team.id, myPicks?.tapadoId)}</span>
                 </div>
                 
                 {myPicks?.tapadoId === team.id ? (
                   <div className="flex items-center gap-2 text-[#FF3E00] font-black text-[10px] uppercase tracking-widest bg-white/10 p-2 border border-white/20">
                      <Star className="w-4 h-4 fill-current" />
                                                 <span>{tr('El tapado', 'Wildcard')}</span>
                   </div>
                 ) : (
                   <button 
                               disabled={!!myPicks?.tapadoId || picksArePublished}
                     onClick={() => handleSetTapado(team.id)}
                     className={cn(
                       "w-full py-3 border-2 border-black text-[10px] font-black uppercase tracking-widest transition-all",
                                  !!myPicks?.tapadoId || picksArePublished
                        ? "hidden"
                        : "hover:bg-[#FF3E00] hover:text-white"
                     )}
                   >
                                              {tr('Asignar tapado', 'Assign wildcard')}
                   </button>
                 )}
               </div>

               {myPicks?.tapadoId === team.id && (
                 <div className="absolute -top-4 -right-4 bg-[#FF3E00] p-2 border-2 border-black rotate-12">
                   <Star className="w-5 h-5 text-white fill-current" />
                 </div>
               )}
             </motion.div>
           ))}

           {Array.from({ length: 4 - myTeams.length }).map((_, i) => (
             <div key={i} className="p-5 sm:p-8 border-4 border-dashed border-black/20 bg-black/5 flex flex-col items-center justify-center text-center gap-4 min-h-72 sm:min-h-80">
                <div className="w-12 h-12 border-2 border-black/20 flex items-center justify-center">
                   <Users className="w-6 h-6 opacity-20" />
                </div>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-20">{tr('Espacio pendiente // Finaliza tu seleccion', 'Pending slot // Finish your selection')}</p>
             </div>
           ))}
        </div>
      </section>

      {/* Participants Feed */}
      <section>
         <div className="flex items-center justify-between mb-6 sm:mb-8 pb-4 border-b-2 border-black/10 gap-4">
            <h2 className="text-2xl sm:text-3xl font-serif italic font-black uppercase flex items-center gap-3 sm:gap-4">
               <span className="bg-black text-white w-10 h-10 flex items-center justify-center not-italic font-sans text-xl">L</span>
               {tr('Clasificacion', 'Leaderboard')}
            </h2>
            <div className="flex border-2 border-black bg-white overflow-hidden">
               <button 
                  onClick={() => setView('grid')} 
                  className={cn("p-2 transition-all", view === 'grid' ? "bg-black text-white" : "text-black hover:bg-black/5")}
               >
                  <LayoutGrid className="w-5 h-5" />
               </button>
               <button 
                  onClick={() => setView('table')}
                  className={cn("p-2 transition-all border-l-2 border-black", view === 'table' ? "bg-black text-white" : "text-black hover:bg-black/5")}
               >
                  <Users className="w-5 h-5" />
               </button>
            </div>
         </div>

             {hideOpponentTeams && (
                <div className="mb-6 border-2 border-black bg-[#F5F2ED] p-4">
                   <p className="text-[10px] font-black uppercase tracking-widest opacity-70">
                      {tr('Modo picks ocultos activo. Se publicaran automaticamente en la fecha definida por el admin.', 'Hidden picks mode is active. Picks will be published automatically on the admin date.')}
                      {picksRevealAtDate ? ` ${tr('Fecha', 'Date')}: ${picksRevealAtDate.toLocaleString()}.` : ''}
                   </p>
                   <p className="mt-2 text-[10px] font-black uppercase tracking-widest opacity-60">
                      {tr('Jugadores con plantilla completa', 'Players with complete squad')}: {participantsReadyCount}/{league.participants.length}
                   </p>
                   {resultsLoadError && (
                      <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-[#FF3E00]">
                         {resultsLoadError}
                      </p>
                   )}
                </div>
             )}

         {view === 'grid' ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8">
                     {leaderboard.map((entry, idx) => {
                        const uid = entry.uid;
                const userPicks = picks[uid];
                const isMe = uid === user?.uid;
                        const canViewTeams = isMe || !hideOpponentTeams;
                        const visibleTeamIds = canViewTeams
                           ? (isMe || hideOpponentTeams || !userPicks?.tapadoId
                              ? (userPicks?.teamIds || [])
                              : (userPicks?.teamIds || []).filter((teamId: string) => teamId !== userPicks.tapadoId))
                           : [];
                        const teams = WORLD_CUP_TEAMS.filter(t => visibleTeamIds.includes(t.id));
                        const hasHiddenTapado = canViewTeams && !isMe && !hideOpponentTeams && !!userPicks?.tapadoId && (userPicks?.teamIds || []).includes(userPicks.tapadoId);
                        const emptySlots = Math.max(0, 4 - teams.length - (hasHiddenTapado ? 1 : 0));

                return (
                  <motion.div 
                    key={uid}
                    className={cn(
                      "p-5 sm:p-8 border-4 transition-all relative",
                      isMe ? "bg-white border-black shadow-[10px_10px_0px_0px_rgba(255,62,0,1)]" : "bg-white border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]"
                    )}
                  >
                    <div className="absolute -top-4 -right-4 bg-black text-white px-3 py-1 font-serif italic text-xl border-2 border-white">
                       #{idx + 1}
                    </div>

                    <div className="flex items-center gap-4 mb-8">
                       <img src={users[uid]?.photoURL} className="w-12 h-12 border-2 border-black" referrerPolicy="no-referrer" />
                       <div>
                          <h4 className="font-serif italic text-xl sm:text-2xl leading-none wrap-break-word">
                             {users[uid]?.displayName}
                          </h4>
                          <p className="text-[10px] font-black uppercase tracking-widest text-[#FF3E00]">{entry.points} {tr('PUNTOS', 'POINTS')}</p>
                       </div>
                    </div>

                    <div className="flex gap-3">
                                  {canViewTeams ? (
                                     <>
                                        {teams.map(t => (
                                           <div key={t.id} className="relative group cursor-help border-2 border-black p-2 bg-[#F5F2ED] flex-1 flex items-center justify-center">
                                                <span className="text-3xl transition-all">{t.flag}</span>
                                                {isMe && userPicks?.tapadoId === t.id && (
                                                   <Star className="absolute -top-2 -right-2 w-4 h-4 text-[#FF3E00] fill-current" />
                                                )}
                                           </div>
                                        ))}
                                        {hasHiddenTapado && (
                                           <div className="relative flex-1 h-12 border-2 border-dashed border-black/30 bg-black/5 flex items-center justify-center text-[10px] font-black uppercase tracking-widest opacity-70">
                                              {tr('Tapado oculto', 'Hidden wildcard')}
                                           </div>
                                        )}
                                        {Array.from({ length: emptySlots }).map((_, i) => (
                                           <div key={i} className="flex-1 h-12 bg-black/5 border-2 border-dashed border-black/10" />
                                        ))}
                                     </>
                                  ) : (
                                     <div className="w-full h-12 border-2 border-dashed border-black/20 bg-black/5 flex items-center justify-center text-[10px] font-black uppercase tracking-widest opacity-50">
                                        {tr('Picks ocultos', 'Hidden picks')}
                                     </div>
                                  )}
                    </div>
                  </motion.div>
                );
              })}
           </div>
         ) : (
           <div className="bg-white border-4 border-black overflow-x-auto shadow-[12px_12px_0px_0px_rgba(0,0,0,0.1)]">
              <table className="w-full min-w-215 text-left font-sans">
                 <thead>
                    <tr className="bg-black text-white text-[10px] font-black uppercase tracking-[0.2em]">
                       <th className="px-8 py-4">{tr('Posicion', 'Rank')}</th>
                       <th className="px-8 py-4">{tr('Jugador', 'Player')}</th>
                       <th className="px-8 py-4">{tr('Bombo', 'Pot')} A</th>
                       <th className="px-8 py-4">{tr('Bombo', 'Pot')} B</th>
                       <th className="px-8 py-4">{tr('Bombo', 'Pot')} C</th>
                       <th className="px-8 py-4">{tr('Bombo', 'Pot')} D</th>
                       <th className="px-8 py-4 text-right">{tr('Total', 'Total')}</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y-2 divide-black/10">
                              {leaderboard.map((entry, idx) => {
                                 const uid = entry.uid;
                      const userPicks = picks[uid];
                                 const isMe = uid === user?.uid;
                                 const canViewTeams = isMe || !hideOpponentTeams;
                                 const visibleTeamIds = canViewTeams
                                    ? (isMe || hideOpponentTeams || !userPicks?.tapadoId
                                          ? (userPicks?.teamIds || [])
                                          : (userPicks?.teamIds || []).filter((teamId: string) => teamId !== userPicks.tapadoId))
                                    : [];
                                 const hiddenTapadoPot = !isMe && !hideOpponentTeams && userPicks?.tapadoId
                                    ? WORLD_CUP_TEAMS.find(t => t.id === userPicks.tapadoId)?.pot
                                    : null;
                                 const tA = WORLD_CUP_TEAMS.find(t => t.pot === 'A' && visibleTeamIds.includes(t.id));
                                 const tB = WORLD_CUP_TEAMS.find(t => t.pot === 'B' && visibleTeamIds.includes(t.id));
                                 const tC = WORLD_CUP_TEAMS.find(t => t.pot === 'C' && visibleTeamIds.includes(t.id));
                                 const tD = WORLD_CUP_TEAMS.find(t => t.pot === 'D' && visibleTeamIds.includes(t.id));

                      return (
                        <tr key={uid} className="hover:bg-[#F5F2ED] transition-colors group">
                           <td className="px-8 py-6 font-serif italic text-xl">#{idx + 1}</td>
                           <td className="px-8 py-6">
                              <div className="flex items-center gap-4">
                                 <img src={users[uid]?.photoURL} className="w-10 h-10 border-2 border-black" />
                                 <span className="font-serif italic text-xl">{users[uid]?.displayName}</span>
                              </div>
                           </td>
                           <td className="px-8 py-6">
                              <div className="flex items-center gap-2">
                                 <span className="text-3xl">{!canViewTeams ? '🔒' : (tA?.flag || (hiddenTapadoPot === 'A' ? '🕵️' : '—'))}</span>
                                 {isMe && userPicks?.tapadoId === tA?.id && <Star className="w-4 h-4 text-[#FF3E00] fill-current" />}
                              </div>
                           </td>
                           <td className="px-8 py-6">
                              <div className="flex items-center gap-2">
                                 <span className="text-3xl">{!canViewTeams ? '🔒' : (tB?.flag || (hiddenTapadoPot === 'B' ? '🕵️' : '—'))}</span>
                                 {isMe && userPicks?.tapadoId === tB?.id && <Star className="w-4 h-4 text-[#FF3E00] fill-current" />}
                              </div>
                           </td>
                           <td className="px-8 py-6">
                              <div className="flex items-center gap-2">
                                 <span className="text-3xl">{!canViewTeams ? '🔒' : (tC?.flag || (hiddenTapadoPot === 'C' ? '🕵️' : '—'))}</span>
                                 {isMe && userPicks?.tapadoId === tC?.id && <Star className="w-4 h-4 text-[#FF3E00] fill-current" />}
                              </div>
                           </td>
                           <td className="px-8 py-6">
                              <div className="flex items-center gap-2">
                                 <span className="text-3xl">{!canViewTeams ? '🔒' : (tD?.flag || (hiddenTapadoPot === 'D' ? '🕵️' : '—'))}</span>
                                 {isMe && userPicks?.tapadoId === tD?.id && <Star className="w-4 h-4 text-[#FF3E00] fill-current" />}
                              </div>
                           </td>
                           <td className="px-8 py-6 text-right">
                              <span className="font-serif italic font-black text-[#FF3E00] text-3xl">{entry.points}</span>
                           </td>
                        </tr>
                      );
                    })}
                 </tbody>
              </table>
           </div>
         )}
      </section>

      {/* Rules Notice */}
      <div className="bg-black text-white p-6 sm:p-12 border-l-8 sm:border-l-16 border-[#FF3E00] flex flex-col md:flex-row items-start md:items-center gap-6 sm:gap-12 relative overflow-hidden">
         <div className="absolute top-0 right-0 opacity-5 text-9xl font-serif font-black italic select-none">RULES</div>
         <div className="flex-1 relative z-10">
            <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.22em] sm:tracking-[0.5em] mb-4 sm:mb-6 opacity-60">{tr('Matriz de puntuacion // Edicion 2026', 'Scoring matrix // 2026 edition')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 sm:gap-12">
               <div>
                  <p className="font-serif italic text-xl sm:text-2xl mb-2 underline decoration-[#FF3E00]">{tr('Fase de grupos', 'Groups')}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-80">{tr('Victoria: 3 pts', 'Win: 3 pts')}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-80">{tr('Empate: 1 pt', 'Draw: 1 pt')}</p>
               </div>
               <div>
                  <p className="font-serif italic text-xl sm:text-2xl mb-2 underline decoration-[#FF3E00]">{tr('Eliminatorias', 'Knockout')}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-80">{tr('16avos: +4 pts', 'Round of 32: +4 pts')}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-80">{tr('Octavos: +6 pts', 'Round of 16: +6 pts')}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-80">{tr('Cuartos: +8 pts', 'Quarterfinals: +8 pts')}</p>
               </div>
               <div>
                  <p className="font-serif italic text-xl sm:text-2xl mb-2 underline decoration-[#FF3E00]">{tr('Fase final', 'Final rounds')}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-80">{tr('Semifinal: +10 pts', 'Semis: +10 pts')}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-80">{tr('Final: +12 pts', 'Final: +12 pts')}</p>
               </div>
               <div>
                  <p className="font-serif italic text-xl sm:text-2xl mb-2 text-[#FF3E00]">{tr('El tapado', 'Wildcard')}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#FF3E00]">{tr('Duplica puntos en eliminatorias', 'Double points in knockouts')}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#FF3E00]">{tr('Penalizacion de -5 pts si queda fuera', 'Penalty of -5 pts if eliminated')}</p>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};
