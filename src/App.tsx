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
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';

interface LeagueData {
  id: string;
  name: string;
  adminId: string;
  status: string;
  participants: string[];
}

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [leagues, setLeagues] = useState<LeagueData[]>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);
  const [userPicks, setUserPicks] = useState<any>(null);
  const [leaguesLoading, setLeaguesLoading] = useState(true);
  const [picksLoading, setPicksLoading] = useState(true);

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

        const urlLeagueId = new URLSearchParams(window.location.search).get('league');
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

  const currentLeague = leagues.find((league: LeagueData) => league.id === selectedLeagueId) || null;

  if (loading || leaguesLoading || picksLoading) {
    return (
      <div className="min-h-screen bg-[#F5F2ED] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-24 h-24 border-8 border-black border-t-[#FF3E00] animate-spin shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]" />
          <p className="text-black font-black uppercase tracking-[0.4em] animate-pulse">Syncing Matrix...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F5F2ED] text-[#1A1A1A]">
        <Header />
        <Welcome />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F2ED] text-[#1A1A1A] selection:bg-[#FF3E00]/20">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {leagues.length > 1 && (
          <div className="mb-10 border-4 border-black bg-white p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50 mb-4">Select your league</p>
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
                 <h2 className="text-4xl font-serif font-black italic uppercase mb-6 leading-none">No League Assigned</h2>
                 <p className="text-xs font-black uppercase tracking-widest opacity-60 mb-12">This Google account is not part of any league yet.</p>
                 <button 
                   onClick={async () => {
                     const { setDoc, doc, serverTimestamp } = await import('firebase/firestore');
                     const generatedLeagueId = `league-${Date.now().toString(36)}`;
                     await setDoc(doc(db, 'leagues', generatedLeagueId), {
                       name: `Porra de ${profile?.displayName || 'Mi Grupo'}`,
                       adminId: user.uid,
                       status: 'active',
                       participants: [user.uid],
                       createdAt: serverTimestamp()
                     });
                   }}
                   className="w-full bg-black text-white py-6 text-xl font-black uppercase tracking-widest hover:bg-[#FF3E00] transition-all shadow-[8px_8px_0px_0px_rgba(255,62,0,0.3)]"
                 >
                   Create My League
                 </button>
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

