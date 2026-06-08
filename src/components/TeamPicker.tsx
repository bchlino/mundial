import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import { doc, updateDoc, setDoc, getDoc, arrayUnion } from 'firebase/firestore';
import { WORLD_CUP_TEAMS, WORLD_CUP_GROUPS, Team } from '../lib/teams';
import { motion, AnimatePresence } from 'motion/react';
import { Info, CheckCircle2, ChevronRight, Trophy, Star, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { useLanguage } from '../lib/LanguageContext';

interface LeagueData {
  id: string;
  name: string;
  picksRevealAt?: { toDate?: () => Date } | null;
}

export const TeamPicker: React.FC<{ league: LeagueData }> = ({ league }) => {
  const { user } = useAuth();
  const { tr } = useLanguage();
  const [currentPot, setCurrentPot] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [tapadoId, setTapadoId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isGroupsOpen, setIsGroupsOpen] = useState(false);

  const pots: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
  const picksRevealAtDate = league.picksRevealAt?.toDate?.() ?? null;
  const isSelectionLocked = picksRevealAtDate ? Date.now() >= picksRevealAtDate.getTime() : false;

  useEffect(() => {
    if (!user?.uid) {
      setSelections({});
      return;
    }

    const loadExistingPicks = async () => {
      setIsLoadingExisting(true);
      setErrorMessage(null);
      try {
        const existingDoc = await getDoc(doc(db, 'leagues', league.id, 'picks', user.uid));
        if (!existingDoc.exists()) {
          setSelections({});
          setTapadoId(null);
          return;
        }

        const existing = existingDoc.data() as { teamIds?: string[]; tapadoId?: string };
        const byPot: Record<string, string> = {};
        (existing.teamIds || []).forEach((teamId) => {
          const foundTeam = WORLD_CUP_TEAMS.find((team) => team.id === teamId);
          if (foundTeam) {
            byPot[foundTeam.pot] = foundTeam.id;
          }
        });

        setSelections(byPot);
        setTapadoId(existing.tapadoId || null);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `leagues/${league.id}/picks/${user.uid}`);
        setErrorMessage(tr('No se pudo cargar tu seleccion actual.', 'Could not load your current selection.'));
      } finally {
        setIsLoadingExisting(false);
      }
    };

    loadExistingPicks();
  }, [league.id, user?.uid, tr]);

  const getNextUnselectedPot = (fromPot?: 'A' | 'B' | 'C' | 'D') => {
    const ordered = fromPot
      ? [...pots.slice(pots.indexOf(fromPot) + 1), ...pots.slice(0, pots.indexOf(fromPot) + 1)]
      : pots;

    return ordered.find((pot) => !selections[pot]) || null;
  };

  const handlePick = (teamId: string) => {
    if (isSelectionLocked) {
      setErrorMessage(tr('La seleccion ya esta cerrada para esta liga.', 'Selection is already locked for this league.'));
      return;
    }

    setStatusMessage(null);
    setErrorMessage(null);
    setSelections((prev) => {
      const next = { ...prev, [currentPot]: teamId };
      const selectedTeams = pots.map((pot) => next[pot]).filter(Boolean) as string[];

      if (tapadoId && !selectedTeams.includes(tapadoId)) {
        setTapadoId(null);
      }

      const nextPot = [...pots.slice(pots.indexOf(currentPot) + 1), ...pots.slice(0, pots.indexOf(currentPot) + 1)]
        .find((pot) => !next[pot]);

      if (nextPot) {
        setCurrentPot(nextPot);
      }

      return next;
    });
  };

  const handleSetTapado = (teamId: string) => {
    if (isSelectionLocked) {
      setErrorMessage(tr('La seleccion ya esta cerrada para esta liga.', 'Selection is already locked for this league.'));
      return;
    }

    setStatusMessage(null);
    setErrorMessage(null);
    setTapadoId((prev) => (prev === teamId ? null : teamId));
  };

  const handleFinalize = async () => {
    if (!user || Object.keys(selections).length < 4) return;
    if (isSelectionLocked) {
      setErrorMessage(tr('La fecha limite ya paso. Ya no puedes editar tus paises.', 'The deadline has passed. You can no longer edit your countries.'));
      return;
    }
    
    setIsSubmitting(true);
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      const teamIds = pots.map((pot) => selections[pot]).filter(Boolean);
      await setDoc(doc(db, 'leagues', league.id, 'picks', user.uid), {
        userId: user.uid,
        teamIds,
        tapadoId: tapadoId || null,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // Add user to participants if not already there
      const leagueRef = doc(db, 'leagues', league.id);
      await updateDoc(leagueRef, {
        participants: arrayUnion(user.uid)
      });

      setStatusMessage(tr('Tu seleccion fue guardada. Puedes cambiarla (incluido el tapado) hasta la fecha limite.', 'Your selection was saved. You can edit it (including wildcard) until the deadline.'));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `leagues/${league.id}/picks/${user.uid}`);
      setErrorMessage(tr('No se pudo guardar la seleccion. Intentalo de nuevo.', 'Could not save the selection. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentSelection = selections[currentPot];
  const allSelected = Object.keys(selections).length === 4;
  const selectedTeams = pots
    .map((pot) => selections[pot])
    .filter(Boolean)
    .map((teamId) => WORLD_CUP_TEAMS.find((team) => team.id === teamId))
    .filter(Boolean) as Team[];
  const remainingPots = pots.filter((p) => !selections[p]);
  const completion = Math.round((Object.keys(selections).length / pots.length) * 100);
  const nextPendingPot = getNextUnselectedPot(currentPot);

  return (
    <div className="max-w-6xl mx-auto space-y-8 sm:space-y-12 pb-28 sm:pb-0">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 sm:gap-8 border-b-8 border-black pb-6 sm:pb-8">
        <div>
          <span className="inline-block px-3 py-1 bg-[#FF3E00] text-white text-[10px] font-black uppercase tracking-widest mb-6 -translate-y-1">
            {tr('Fase 01 // Seleccion de plantilla', 'Phase 01 // Team selection')}
          </span>
          <h2 className="text-4xl sm:text-8xl font-serif font-black italic uppercase tracking-tighter leading-none">
            {tr('Elegir', 'Pick')} <span className="text-[#FF3E00]">{tr('Plantilla', 'Squad')}</span>
          </h2>
        </div>
        <div className="text-left md:text-right">
           <p className="text-xs font-black uppercase tracking-[0.3em] opacity-40 mb-2">{tr('Estado general', 'Overall status')}</p>
           <div className="flex gap-2 justify-start md:justify-end">
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {pots.map(p => (
          <button
            key={p}
            onClick={() => setCurrentPot(p)}
            className={cn(
              "p-4 sm:p-6 border-4 font-black uppercase text-[10px] sm:text-xs tracking-[0.12em] sm:tracking-[0.2em] transition-all flex flex-col gap-2 relative",
              currentPot === p 
                ? "bg-black text-white translate-x-1 translate-y-1 shadow-none" 
                : "bg-white text-black hover:bg-[#F5F2ED] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none translate-x-0 active:translate-x-1 active:translate-y-1"
            )}
          >
            <span>{tr('Bombo', 'Pot')} {p}</span>
            <span className="font-serif italic text-lg sm:text-2xl normal-case leading-tight">
              {selections[p] ? WORLD_CUP_TEAMS.find(t => t.id === selections[p])?.name : tr('Espacio vacio', 'Empty slot')}
            </span>
            <span className="text-[10px] tracking-wider uppercase opacity-70">
              {selections[p] ? tr('Completado', 'Completed') : tr('Pendiente', 'Pending')}
            </span>
            {currentPot === p && (
              <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#FF3E00] rotate-45" />
            )}
          </button>
        ))}
      </div>

      <div className="border-4 border-black bg-white p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{tr('Progreso de seleccion', 'Selection progress')}</p>
            <p className="text-sm sm:text-base font-bold mt-1">
              {Object.keys(selections).length}/4 {tr('bombos completados.', 'pots completed.')} {remainingPots.length > 0 ? `${tr('Falta', 'Missing')}: ${remainingPots.join(', ')}` : tr('Plantilla lista para confirmar.', 'Squad ready to confirm.')}
            </p>
            {picksRevealAtDate && (
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mt-2">
                {tr('Cierre de seleccion', 'Selection lock')}: {picksRevealAtDate.toLocaleString()}
              </p>
            )}
            <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mt-2">
              {tr('Consulta grupos sin salir del pick.', 'Check groups without leaving the picker.')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setIsGroupsOpen(true)}
              className="border-2 border-black px-4 py-2 text-xs font-black uppercase tracking-wider bg-[#F5F2ED] hover:bg-black hover:text-white transition-colors flex items-center gap-2"
            >
              <Info className="w-4 h-4" />
              {tr('Ver grupos del mundial', 'View world cup groups')}
            </button>
            {nextPendingPot && (
              <button
                type="button"
                onClick={() => setCurrentPot(nextPendingPot)}
                className="border-2 border-black px-4 py-2 text-xs font-black uppercase tracking-wider hover:bg-black hover:text-white transition-colors"
              >
                {tr('Ir al siguiente pendiente', 'Go to next pending')}: {nextPendingPot}
              </button>
            )}
          </div>
        </div>
        <div className="mt-4 h-3 border-2 border-black bg-[#F5F2ED]">
          <div className="h-full bg-[#FF3E00] transition-all duration-300" style={{ width: `${completion}%` }} />
        </div>
        {isLoadingExisting && (
          <p className="mt-4 text-[10px] font-black uppercase tracking-widest opacity-60">
            {tr('Cargando seleccion guardada...', 'Loading saved selection...')}
          </p>
        )}
        {isSelectionLocked && (
          <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-[#FF3E00]">
            {tr('La seleccion quedo bloqueada. Espera la publicacion de picks.', 'Selection is locked. Wait for picks to be published.')}
          </p>
        )}
        {statusMessage && (
          <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-green-700">{statusMessage}</p>
        )}
        {errorMessage && (
          <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-[#FF3E00]">{errorMessage}</p>
        )}
      </div>

      {allSelected && (
        <div className="border-4 border-black bg-white p-5 sm:p-6">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-60">
            {tr('Tapado (opcional y privado)', 'Wildcard (optional and private)')}
          </p>
          <p className="text-xs font-black uppercase tracking-widest opacity-70 mt-2">
            {tr('Solo tu lo ves. El resto de jugadores no vera tu tapado.', 'Only you can see it. Other players will not see your wildcard.')}
          </p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {selectedTeams.map((team) => {
              const isTapado = tapadoId === team.id;

              return (
                <button
                  key={team.id}
                  type="button"
                  onClick={() => handleSetTapado(team.id)}
                  disabled={isSelectionLocked || isLoadingExisting}
                  className={cn(
                    'border-2 border-black px-4 py-3 text-left transition-colors',
                    isTapado ? 'bg-black text-white' : 'bg-[#F5F2ED] hover:bg-white',
                    (isSelectionLocked || isLoadingExisting) && 'opacity-60 cursor-not-allowed'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-lg font-serif italic font-black uppercase">{team.flag} {team.name}</span>
                    <Star className={cn('w-4 h-4', isTapado ? 'text-[#FF3E00] fill-current' : 'opacity-40')} />
                  </div>
                  <p className="mt-2 text-[10px] font-black uppercase tracking-widest opacity-70">
                    {isTapado ? tr('Tapado activo', 'Active wildcard') : tr('Marcar como tapado', 'Mark as wildcard')}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-8">
        {WORLD_CUP_TEAMS.filter(t => t.pot === currentPot).map(team => {
          const isSelected = currentSelection === team.id;
          return (
            <motion.button
              key={team.id}
              whileHover={{ x: 4, y: -4 }}
              onClick={() => handlePick(team.id)}
              disabled={isSelectionLocked || isLoadingExisting}
              className={cn(
                "relative p-5 sm:p-8 border-4 transition-all text-left flex flex-col min-h-50 sm:min-h-55",
                isSelected 
                  ? "bg-black text-white border-black shadow-[10px_10px_0px_0px_rgba(255,62,0,1)]" 
                  : "bg-white border-black hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,0.1)] cursor-pointer",
                (isSelectionLocked || isLoadingExisting) && "opacity-60 cursor-not-allowed hover:shadow-none"
              )}
            >
              <div className="flex-1 mt-6">
                <div className="text-4xl sm:text-5xl mb-4 sm:mb-6">{team.flag}</div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-1 block">{tr('Nivel nacional', 'National tier')}</span>
                <h4 className="font-serif italic text-3xl font-black uppercase leading-tight wrap-break-word">{team.name}</h4>
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
              <p className="mt-3 text-[10px] font-black uppercase tracking-widest opacity-70">
                {isSelected ? tr('Seleccionado para este bombo', 'Selected for this pot') : tr('Click para seleccionar', 'Click to select')}
              </p>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {isGroupsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 p-3 sm:p-6"
            onClick={() => setIsGroupsOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.2 }}
              className="mx-auto h-full max-w-5xl bg-white border-4 border-black flex flex-col"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="border-b-2 border-black p-4 sm:p-5 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{tr('Consulta rapida', 'Quick lookup')}</p>
                  <h3 className="text-xl sm:text-2xl font-serif italic font-black uppercase">{tr('Grupos del mundial', 'World cup groups')}</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mt-2">
                    {tr('Referencia de grupos para elegir mejor tu plantilla.', 'Group reference to help you choose your squad.')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsGroupsOpen(false)}
                  className="border-2 border-black px-3 py-2 text-xs font-black uppercase tracking-wider hover:bg-black hover:text-white transition-colors flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  {tr('Cerrar', 'Close')}
                </button>
              </div>

              <div className="p-3 sm:p-5 overflow-y-auto">
                <div className="mb-4 border-2 border-black bg-[#FFF0E8] px-3 py-2">
                  <p className="text-[10px] font-black uppercase tracking-widest">
                    {tr('Resaltado actual', 'Current highlight')}: {tr('Bombo', 'Pot')} {currentPot}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                  {WORLD_CUP_GROUPS.map((group) => (
                    <article key={group.id} className="border-2 border-black bg-[#F5F2ED] p-3 sm:p-4">
                      <div className="flex items-center justify-between mb-3 border-b border-black/20 pb-2">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{tr('Grupo', 'Group')}</p>
                        <p className="text-2xl font-serif italic font-black">{group.id}</p>
                      </div>
                      <ul className="space-y-2">
                        {group.teams.map((team) => (
                          <li
                            key={team.id}
                            className={cn(
                              'flex items-center justify-between border px-3 py-2',
                              team.pot === currentPot
                                ? 'border-black bg-[#FF3E00] text-white'
                                : 'border-black/20 bg-white'
                            )}
                          >
                            <span className="text-sm font-black uppercase tracking-wide flex items-center gap-2">
                              <span className="text-lg">{team.flag}</span>
                              {team.name}
                            </span>
                            <span className={cn(
                              'text-[10px] font-black uppercase tracking-wider',
                              team.pot === currentPot ? 'opacity-100' : 'opacity-60'
                            )}>
                              {tr('Bombo', 'Pot')} {team.pot}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {allSelected && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-4 left-0 right-0 px-4 flex justify-center z-50"
          >
            <button
              onClick={handleFinalize}
              disabled={isSubmitting || isSelectionLocked || isLoadingExisting}
              className="w-full max-w-xl bg-black text-white px-5 sm:px-12 py-4 sm:py-8 text-base sm:text-3xl font-serif italic font-black uppercase tracking-tight sm:tracking-tighter border-4 sm:border-8 border-white shadow-[12px_12px_0px_0px_rgba(255,62,0,1)] sm:shadow-[24px_24px_0px_0px_rgba(255,62,0,1)] hover:bg-[#FF3E00] transition-all flex items-center justify-center gap-3 sm:gap-8 group"
            >
              {isSubmitting ? tr('Sincronizando...', 'Syncing...') : tr('Guardar seleccion', 'Save selection')}
              <Trophy className="w-6 h-6 sm:w-10 sm:h-10 group-hover:rotate-12 transition-transform" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
