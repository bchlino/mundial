/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { Header } from './components/Header';
import { Welcome } from './components/Welcome';
import { TeamPicker } from './components/TeamPicker';
import { Dashboard } from './components/Dashboard';
import { db } from './lib/firebase';
import { arrayUnion, collection, doc, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import ResultsAdmin from './components/ResultsAdmin';

interface LeagueData {
  id: string;
  name: string;
  adminId: string;
  status: string;
  participants: string[];
}

function AppContent() {
  const { user, profile, loading } = useAuth();
  const urlLeagueId = new URLSearchParams(window.location.search).get('league');
  const [leagues, setLeagues] = useState<LeagueData[]>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);
  const [userPicks, setUserPicks] = useState<any>(null);
  const [leaguesLoading, setLeaguesLoading] = useState(true);
  const [picksLoading, setPicksLoading] = useState(true);
  const [newLeagueName, setNewLeagueName] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreatingLeague, setIsCreatingLeague] = useState(false);
  const [isJoiningInviteLeague, setIsJoiningInviteLeague] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [hasProcessedInvite, setHasProcessedInvite] = useState(false);

  useEffect(() => {
    if (!user) {
      setLeagues([]);
      setSelectedLeagueId(null);
      setUserPicks(null);
      setLeaguesLoading(false);
      setPicksLoading(false);
      return;
    }

    setLeaguesLoading(true);
    const leaguesQuery = query(collection(db, 'leagues'), where('participants', 'array-contains', user.uid));

    const unsubLeagues = onSnapshot(leaguesQuery, (snapshot) => {
      const availableLeagues: LeagueData[] = snapshot.docs.map((leagueDoc) => ({
        id: leagueDoc.id,
        ...(leagueDoc.data() as Omit<LeagueData, 'id'>),
      }));

      setLeagues(availableLeagues);
      setSelectedLeagueId((previousLeagueId: string | null) => {
        if (previousLeagueId && availableLeagues.some((league) => league.id === previousLeagueId)) {
          return previousLeagueId;
        }

        if (urlLeagueId && availableLeagues.some((league) => league.id === urlLeagueId)) {
          return urlLeagueId;
        }

        const storedLeagueId = window.localStorage.getItem('selectedLeagueId');
        if (storedLeagueId && availableLeagues.some((league) => league.id === storedLeagueId)) {
          return storedLeagueId;
        }

        return availableLeagues[0]?.id ?? null;
      });
      setLeaguesLoading(false);
    });

    return () => {
      unsubLeagues();
    };
  }, [user]);

  useEffect(() => {
    const currentUrl = new URL(window.location.href);

    if (!selectedLeagueId) {
      window.localStorage.removeItem('selectedLeagueId');
      currentUrl.searchParams.delete('league');
      window.history.replaceState({}, '', currentUrl.toString());
      return;
    }

    window.localStorage.setItem('selectedLeagueId', selectedLeagueId);

    if (currentUrl.searchParams.get('league') !== selectedLeagueId) {
      currentUrl.searchParams.set('league', selectedLeagueId);
      window.history.replaceState({}, '', currentUrl.toString());
    }
  }, [selectedLeagueId]);

  useEffect(() => {
    if (!user || !urlLeagueId || leaguesLoading || hasProcessedInvite) return;

    const userIsAlreadyInInviteLeague = leagues.some((league) => league.id === urlLeagueId);
    if (userIsAlreadyInInviteLeague) {
      setSelectedLeagueId(urlLeagueId);
      setHasProcessedInvite(true);
      return;
    }

    const joinInviteLeague = async () => {
      setIsJoiningInviteLeague(true);
      setInviteError(null);
      try {
        await updateDoc(doc(db, 'leagues', urlLeagueId), {
          participants: arrayUnion(user.uid),
        });
        setSelectedLeagueId(urlLeagueId);
      } catch (error) {
        console.error('Error joining invited league:', error);
        setInviteError('No se pudo unir a la liga del enlace. Verifica que la invitacion sea valida.');
      } finally {
        setIsJoiningInviteLeague(false);
        setHasProcessedInvite(true);
      }
    };

    joinInviteLeague();
  }, [user, urlLeagueId, leaguesLoading, leagues, hasProcessedInvite]);

  useEffect(() => {
    if (!user) {
      setHasProcessedInvite(false);
      return;
    }

    if (!user || !selectedLeagueId) {
      setUserPicks(null);
      setPicksLoading(false);
      return;
    }

    setPicksLoading(true);
    const unsubPicks = onSnapshot(doc(db, 'leagues', selectedLeagueId, 'picks', user.uid), (pickDoc) => {
      if (pickDoc.exists()) {
        setUserPicks(pickDoc.data());
      } else {
        setUserPicks(null);
      }
      setPicksLoading(false);
    });

    return () => {
      unsubPicks();
    };
  }, [user, selectedLeagueId]);

  const handleCreateLeague = async () => {
    const trimmedLeagueName = newLeagueName.trim();
    if (!user || !trimmedLeagueName) return;

    setIsCreatingLeague(true);
    setCreateError(null);
    try {
      const leagueRef = doc(collection(db, 'leagues'));
      await setDoc(leagueRef, {
        name: trimmedLeagueName,
        adminId: user.uid,
        status: 'active',
        participants: [user.uid],
        createdAt: serverTimestamp(),
      });

      setNewLeagueName('');
      setSelectedLeagueId(leagueRef.id);
    } catch (error) {
      console.error('Error creating league:', error);
      setCreateError('No se pudo crear la liga. Intentalo nuevamente.');
    } finally {
      setIsCreatingLeague(false);
    }
  };

  const currentLeague = leagues.find((league: LeagueData) => league.id === selectedLeagueId) || null;
  const adminLeaguesCount = leagues.filter((league: LeagueData) => league.adminId === user?.uid).length;

  if (loading || leaguesLoading || picksLoading) {
    return (
      <div className="min-h-screen bg-[#F5F2ED] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-24 h-24 border-8 border-black border-t-[#FF3E00] animate-spin shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]" />
          <p className="text-black font-black uppercase tracking-[0.4em] animate-pulse">Sincronizando matriz (Syncing matrix)...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F5F2ED] text-[#1A1A1A]">
        <Header activeLeagueId={null} />
        <Welcome />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F2ED] text-[#1A1A1A] selection:bg-[#FF3E00]/20">
      <Header activeLeagueId={selectedLeagueId} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10 border-4 border-black bg-white p-6">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50 mb-2">Crear liga privada (Create private league)</p>
          <p className="text-xs font-black uppercase tracking-widest opacity-60 mb-4">
            Ligas administradas (Admin leagues): {adminLeaguesCount}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={newLeagueName}
              onChange={(event) => setNewLeagueName(event.target.value)}
              placeholder={`Liga Mundial ${profile?.displayName || 'Mi Grupo'}`}
              className="flex-1 border-4 border-black p-4 text-sm font-black uppercase tracking-wider focus:outline-none"
            />
            <button
              onClick={handleCreateLeague}
              disabled={isCreatingLeague || !newLeagueName.trim()}
              className="bg-black text-white px-6 py-4 text-sm font-black uppercase tracking-widest hover:bg-[#FF3E00] transition-all disabled:opacity-50"
            >
              {isCreatingLeague ? 'Creando liga (Creating league)...' : 'Crear liga (Create league)'}
            </button>
          </div>
          {createError && (
            <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-[#FF3E00]">{createError}</p>
          )}
        </div>

        {leagues.length > 1 && (
          <div className="mb-10 border-4 border-black bg-white p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50 mb-4">Selecciona tu liga (Select your league)</p>
            <div className="flex flex-wrap gap-3">
              {leagues.map((league) => (
                <button
                  key={league.id}
                  onClick={() => setSelectedLeagueId(league.id)}
                  className={[
                    'px-5 py-3 border-2 font-black uppercase text-xs tracking-wider transition-all',
                    selectedLeagueId === league.id
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-black border-black hover:bg-[#F5F2ED]'
                  ].join(' ')}
                >
                  {league.name || league.id}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {!currentLeague ? (
             <motion.div 
               key="no-league"
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -20 }}
             >
               <div className="max-w-2xl mx-auto text-center mt-20 p-12 border-8 border-black bg-white shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]">
                 <h2 className="text-4xl font-serif font-black italic uppercase mb-6 leading-none">Sin liga asignada (No league assigned)</h2>
                 <p className="text-xs font-black uppercase tracking-widest opacity-60 mb-8">Esta cuenta de Google aun no pertenece a una liga (This Google account is not part of any league yet).</p>

                 {urlLeagueId && !hasProcessedInvite && (
                   <div className="mb-8 p-4 border-2 border-black bg-[#F5F2ED] text-left">
                     <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-3">Invitacion detectada (Invitation detected)</p>
                     <p className="text-xs font-black uppercase tracking-widest">Uniendote a la liga desde el enlace (Joining league from link)...</p>
                   </div>
                 )}

                 {urlLeagueId && hasProcessedInvite && inviteError && (
                   <div className="mb-8 p-4 border-2 border-[#FF3E00] bg-[#FFF1EC] text-left">
                     <p className="text-[10px] font-black uppercase tracking-widest text-[#FF3E00] mb-2">Error de invitacion (Invite error)</p>
                     <p className="text-xs font-black uppercase tracking-widest">{inviteError}</p>
                   </div>
                 )}
                 <p className="text-[10px] font-black uppercase tracking-widest opacity-60">
                   Usa el formulario superior para crear una liga privada (Use the create form above to start a new private league).
                 </p>
               </div>
             </motion.div>
          ) : !userPicks || (userPicks.teamIds || []).length < 4 ? (
            <TeamPicker key={`picker-${currentLeague.id}`} league={currentLeague} />
          ) : (
            <Dashboard key={`dashboard-${currentLeague.id}`} league={currentLeague} />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

