import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import { doc, updateDoc, setDoc, getDoc, arrayUnion } from 'firebase/firestore';
import { WORLD_CUP_TEAMS, Team } from '../lib/teams';
import { motion, AnimatePresence } from 'motion/react';
import { Info, CheckCircle2, ChevronRight, Trophy } from 'lucide-react';
import { cn } from '../lib/utils';

interface LeagueData {
  id: string;
  name: string;
}

export const TeamPicker: React.FC<{ league: LeagueData }> = ({ league }) => {
  const { user } = useAuth();
  const [currentPot, setCurrentPot] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pots: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];

  const handlePick = (teamId: string) => {
    setSelections(prev => ({ ...prev, [currentPot]: teamId }));
  };

  const handleFinalize = async () => {
    if (!user || Object.keys(selections).length < 4) return;
    
    setIsSubmitting(true);
    try {
      const teamIds = Object.values(selections);
      await setDoc(doc(db, 'leagues', league.id, 'picks', user.uid), {
        userId: user.uid,
        teamIds,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // Add user to participants if not already there
      const leagueRef = doc(db, 'leagues', league.id);
      await updateDoc(leagueRef, {
        participants: arrayUnion(user.uid)
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `leagues/${league.id}/picks/${user.uid}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentSelection = selections[currentPot];
  const allSelected = Object.keys(selections).length === 4;

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b-8 border-black pb-8">
        <div>
          <span className="inline-block px-3 py-1 bg-[#FF3E00] text-white text-[10px] font-black uppercase tracking-widest mb-6 translate-y-[-4px]">
            Fase 01 // Seleccion de plantilla (Personnel selection)
          </span>
          <h2 className="text-6xl sm:text-8xl font-serif font-black italic uppercase tracking-tighter leading-none">
            Elegir <span className="text-[#FF3E00]">Plantilla</span>
          </h2>
        </div>
        <div className="text-right">
           <p className="text-xs font-black uppercase tracking-[0.3em] opacity-40 mb-2">Estado general (Aggregate status)</p>
           <div className="flex gap-2 justify-end">
              {pots.map(p => (
                <div 
                  key={p} 
                  className={cn(
                    "w-10 h-10 border-4 border-black flex items-center justify-center font-serif italic font-black text-xl transition-all",
                    selections[p] ? "bg-black text-white" : "bg-white text-black opacity-20"
                  )}
                >
                  {p}
                </div>
              ))}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {pots.map(p => (
          <button
            key={p}
            onClick={() => setCurrentPot(p)}
            className={cn(
              "p-6 border-4 font-black uppercase text-xs tracking-[0.2em] transition-all flex flex-col gap-2 relative",
              currentPot === p 
                ? "bg-black text-white translate-x-1 translate-y-1 shadow-none" 
                : "bg-white text-black hover:bg-[#F5F2ED] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none translate-x-0 active:translate-x-1 active:translate-y-1"
            )}
          >
            <span>Bombo (Tier) {p}</span>
            <span className="font-serif italic text-2xl normal-case">
              {selections[p] ? WORLD_CUP_TEAMS.find(t => t.id === selections[p])?.name : 'Espacio vacio (Empty slot)'}
            </span>
            {currentPot === p && (
              <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#FF3E00] rotate-45" />
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {WORLD_CUP_TEAMS.filter(t => t.pot === currentPot).map(team => {
          const isSelected = currentSelection === team.id;
          return (
            <motion.button
              key={team.id}
              whileHover={{ x: 4, y: -4 }}
              onClick={() => handlePick(team.id)}
              className={cn(
                "relative p-8 border-4 transition-all text-left flex flex-col min-h-[220px]",
                isSelected 
                  ? "bg-black text-white border-black shadow-[10px_10px_0px_0px_rgba(255,62,0,1)]" 
                  : "bg-white border-black hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,0.1)] cursor-pointer"
              )}
            >
              <div className="flex-1 mt-6">
                <div className="text-5xl mb-6">{team.flag}</div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-1 block">Nivel nacional (National tier)</span>
                <h4 className="font-serif italic text-4xl font-black uppercase leading-tight">{team.name}</h4>
              </div>
              
              <div className="mt-8 pt-6 border-t border-black/10 flex justify-between items-end">
                <span className="font-mono text-[10px] uppercase font-bold opacity-60">
                  Ref: FIFA_2026_{team.id.substring(0,3).toUpperCase()}
                </span>
                <div className={cn(
                  "w-10 h-10 border-4 flex items-center justify-center transition-all",
                  isSelected ? "bg-[#FF3E00] border-white text-white" : "bg-white border-black text-black"
                )}>
                  {isSelected ? <CheckCircle2 className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {allSelected && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-12 left-0 right-0 px-4 flex justify-center z-50"
          >
            <button
              onClick={handleFinalize}
              disabled={isSubmitting}
              className="bg-black text-white px-12 py-8 text-3xl font-serif italic font-black uppercase tracking-tighter border-8 border-white shadow-[24px_24px_0px_0px_rgba(255,62,0,1)] hover:bg-[#FF3E00] transition-all flex items-center gap-8 group"
            >
              {isSubmitting ? 'Sincronizando (Syncing)...' : 'Confirmar selecciones (Confirm matrix selections)'}
              <Trophy className="w-10 h-10 group-hover:rotate-12 transition-transform" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
