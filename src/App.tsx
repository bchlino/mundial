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
import { doc, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentLeagueId, setCurrentLeagueId] = useState<string | null>(null);
  const [leagueData, setLeagueData] = useState<any>(null);
  const [userPicks, setUserPicks] = useState<any>(null);
  const [picksLoading, setPicksLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLeagueData(null);
      setUserPicks(null);
      setPicksLoading(false);
      return;
    }

    const leagueId = 'mundial-2026-corp';
    setCurrentLeagueId(leagueId);

    const unsubLeague = onSnapshot(doc(db, 'leagues', leagueId), (doc) => {
      if (doc.exists()) {
        setLeagueData({ id: doc.id, ...doc.data() });
      } else {
        setLeagueData(null);
      }
    });

    const unsubPicks = onSnapshot(doc(db, 'leagues', leagueId, 'picks', user.uid), (doc) => {
      if (doc.exists()) {
        setUserPicks(doc.data());
      } else {
        setUserPicks(null);
      }
      setPicksLoading(false);
    });

    return () => {
      unsubLeague();
      unsubPicks();
    };
  }, [user]);

  if (loading || picksLoading) {
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
        <AnimatePresence mode="wait">
          {!leagueData ? (
             <motion.div 
               key="no-league"
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -20 }}
             >
               <div className="max-w-2xl mx-auto text-center mt-20 p-12 border-8 border-black bg-white shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]">
                 <h2 className="text-4xl font-serif font-black italic uppercase mb-6 leading-none">Access Restricted</h2>
                 <p className="text-xs font-black uppercase tracking-widest opacity-60 mb-12">No active league sequence detected on this server node.</p>
                 <button 
                   onClick={async () => {
                     const { setDoc, doc, serverTimestamp } = await import('firebase/firestore');
                     await setDoc(doc(db, 'leagues', 'mundial-2026-corp'), {
                       name: 'Porra de la Oficina 2026',
                       adminId: user.uid,
                       status: 'active',
                       participants: [user.uid],
                       createdAt: serverTimestamp()
                     });
                   }}
                   className="w-full bg-black text-white py-6 text-xl font-black uppercase tracking-widest hover:bg-[#FF3E00] transition-all shadow-[8px_8px_0px_0px_rgba(255,62,0,0.3)]"
                 >
                   Establish Global League // New
                 </button>
               </div>
             </motion.div>
          ) : !userPicks || (userPicks.teamIds || []).length < 4 ? (
            <TeamPicker key="picker" league={leagueData} />
          ) : (
            <Dashboard key="dashboard" league={leagueData} />
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

