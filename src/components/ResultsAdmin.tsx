import React, { useEffect, useMemo, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { MatchResult } from '../lib/results';
import { WORLD_CUP_TEAMS } from '../lib/teams';

type Stage = MatchResult['stage'];

interface MatchFormState {
  homeTeam: string;
  awayTeam: string;
  homeGoals: string;
  awayGoals: string;
  stage: Stage;
  finished: boolean;
}

interface ResultsAdminProps {
  adminUid: string;
}

const INITIAL_FORM: MatchFormState = {
  homeTeam: '',
  awayTeam: '',
  homeGoals: '0',
  awayGoals: '0',
  stage: 'groups',
  finished: true,
};

const STAGE_OPTIONS: Array<{ value: Stage; label: string }> = [
  { value: 'groups', label: 'Grupos (Groups)' },
  { value: 'round16', label: 'Octavos (Round of 16)' },
  { value: 'quarters', label: 'Cuartos (Quarterfinals)' },
  { value: 'semis', label: 'Semifinal (Semifinals)' },
  { value: 'final', label: 'Final (Final)' },
];

const STAGE_LABEL: Record<Stage, string> = {
  groups: 'Grupos',
  round16: 'Octavos',
  quarters: 'Cuartos',
  semis: 'Semifinal',
  final: 'Final',
};

const normalizeStage = (value: string): Stage => {
  if (value === 'round_of_16') return 'round16';
  if (value === 'quarterfinals') return 'quarters';
  if (value === 'semifinals') return 'semis';
  if (value === 'groups' || value === 'round16' || value === 'quarters' || value === 'semis' || value === 'final') {
    return value;
  }
  return 'groups';
};

const ResultsAdmin: React.FC<ResultsAdminProps> = ({ adminUid }) => {
  const [formData, setFormData] = useState<MatchFormState>(INITIAL_FORM);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'matches'), (snapshot) => {
      const loaded: MatchResult[] = snapshot.docs.map((matchDoc) => {
        const data = matchDoc.data() as any;
        return {
          id: matchDoc.id,
          homeTeam: data.homeTeam,
          awayTeam: data.awayTeam,
          homeGoals: typeof data.homeGoals === 'number' ? data.homeGoals : Number(data.homeScore || 0),
          awayGoals: typeof data.awayGoals === 'number' ? data.awayGoals : Number(data.awayScore || 0),
          stage: normalizeStage(data.stage),
          finished: typeof data.finished === 'boolean' ? data.finished : true,
        };
      });
      setMatches(loaded);
    });

    return () => unsub();
  }, []);

  const teamsByPot = useMemo(() => {
    return ['A', 'B', 'C', 'D'].map((pot) => ({
      pot,
      teams: WORLD_CUP_TEAMS.filter((team) => team.pot === pot),
    }));
  }, []);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggleFinished = () => {
    setFormData((prev) => ({ ...prev, finished: !prev.finished }));
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM);
    setEditingId(null);
  };

  const handleEdit = (match: MatchResult) => {
    setFormData({
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      homeGoals: String(match.homeGoals),
      awayGoals: String(match.awayGoals),
      stage: match.stage,
      finished: match.finished,
    });
    setEditingId(match.id);
    setStatusMessage(null);
    setErrorMessage(null);
  };

  const handleDelete = async (matchId: string) => {
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      await deleteDoc(doc(db, 'matches', matchId));
      if (editingId === matchId) {
        resetForm();
      }
      setStatusMessage('Resultado eliminado correctamente. (Result deleted successfully.)');
    } catch (error) {
      console.error('Error deleting match:', error);
      setErrorMessage('No se pudo eliminar el resultado. (Could not delete result.)');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatusMessage(null);
    setErrorMessage(null);

    if (formData.homeTeam === formData.awayTeam) {
      setErrorMessage('Local y visitante deben ser distintos. (Home and away must be different teams.)');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        homeTeam: formData.homeTeam,
        awayTeam: formData.awayTeam,
        homeGoals: parseInt(formData.homeGoals, 10),
        awayGoals: parseInt(formData.awayGoals, 10),
        stage: formData.stage,
        finished: formData.finished,
      };

      if (editingId) {
        await updateDoc(doc(db, 'matches', editingId), {
          ...payload,
          updatedAt: serverTimestamp(),
        });
        setStatusMessage('Resultado actualizado correctamente. (Result updated successfully.)');
      } else {
        await addDoc(collection(db, 'matches'), {
          ...payload,
          adminId: adminUid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setStatusMessage('Resultado creado correctamente. (Result created successfully.)');
      }

      resetForm();
    } catch (error) {
      console.error('Error saving match:', error);
      setErrorMessage('Hubo un error guardando el resultado. (Error while saving result.)');
    } finally {
      setIsSaving(false);
    }
  };

  const getTeamLabel = (teamId: string) => {
    const found = WORLD_CUP_TEAMS.find((team) => team.id === teamId);
    return found ? `${found.flag} ${found.name}` : teamId;
  };

  return (
    <section className="border-4 border-black bg-white p-6 md:p-8">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl md:text-3xl font-serif italic font-black uppercase">Resultados oficiales (Official results)</h2>
        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Solo admin (Admin only)</span>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 border-2 border-black p-4 bg-[#F5F2ED]">
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest mb-2">Local (Home)</label>
          <select
            name="homeTeam"
            value={formData.homeTeam}
            onChange={handleInputChange}
            className="w-full border-2 border-black p-3 text-sm font-black uppercase"
            required
          >
            <option value="">Selecciona equipo (Select team)</option>
            {teamsByPot.map((group) => (
              <optgroup key={group.pot} label={`Bombo ${group.pot}`}>
                {group.teams.map((team) => (
                  <option key={team.id} value={team.id}>{team.flag} {team.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest mb-2">Visitante (Away)</label>
          <select
            name="awayTeam"
            value={formData.awayTeam}
            onChange={handleInputChange}
            className="w-full border-2 border-black p-3 text-sm font-black uppercase"
            required
          >
            <option value="">Selecciona equipo (Select team)</option>
            {teamsByPot.map((group) => (
              <optgroup key={group.pot} label={`Bombo ${group.pot}`}>
                {group.teams.map((team) => (
                  <option key={team.id} value={team.id}>{team.flag} {team.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest mb-2">Goles local (Home goals)</label>
          <input
            type="number"
            min={0}
            name="homeGoals"
            value={formData.homeGoals}
            onChange={handleInputChange}
            className="w-full border-2 border-black p-3 text-sm font-black uppercase"
            required
          />
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest mb-2">Goles visitante (Away goals)</label>
          <input
            type="number"
            min={0}
            name="awayGoals"
            value={formData.awayGoals}
            onChange={handleInputChange}
            className="w-full border-2 border-black p-3 text-sm font-black uppercase"
            required
          />
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest mb-2">Fase (Stage)</label>
          <select
            name="stage"
            value={formData.stage}
            onChange={handleInputChange}
            className="w-full border-2 border-black p-3 text-sm font-black uppercase"
          >
            {STAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            type="button"
            onClick={handleToggleFinished}
            className={[
              'w-full border-2 p-3 text-sm font-black uppercase tracking-widest transition-colors',
              formData.finished ? 'border-black bg-black text-white' : 'border-black bg-white text-black'
            ].join(' ')}
          >
            {formData.finished ? 'Finalizado (Finished)' : 'Pendiente (Pending)'}
          </button>
        </div>

        <div className="md:col-span-2 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-3 bg-black text-white text-xs font-black uppercase tracking-widest hover:bg-[#FF3E00] transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Guardando...' : editingId ? 'Guardar cambios (Save changes)' : 'Agregar resultado (Add result)'}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-5 py-3 border-2 border-black text-xs font-black uppercase tracking-widest hover:bg-black hover:text-white transition-colors"
            >
              Cancelar edicion (Cancel edit)
            </button>
          )}
        </div>

        {statusMessage && <p className="md:col-span-2 text-[10px] font-black uppercase tracking-widest text-green-700">{statusMessage}</p>}
        {errorMessage && <p className="md:col-span-2 text-[10px] font-black uppercase tracking-widest text-[#FF3E00]">{errorMessage}</p>}
      </form>

      <div className="mt-6 border-2 border-black overflow-x-auto">
        <table className="w-full min-w-190 text-left">
          <thead className="bg-black text-white text-[10px] font-black uppercase tracking-[0.2em]">
            <tr>
              <th className="px-4 py-3">Partido</th>
              <th className="px-4 py-3">Fase</th>
              <th className="px-4 py-3">Resultado</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/10 bg-white">
            {matches.length === 0 ? (
              <tr>
                <td className="px-4 py-4 text-xs font-black uppercase tracking-widest opacity-50" colSpan={5}>
                  No hay resultados cargados aun. (No results yet.)
                </td>
              </tr>
            ) : (
              matches.map((match) => (
                <tr key={match.id} className="hover:bg-[#F5F2ED]">
                  <td className="px-4 py-3 text-xs font-black uppercase tracking-wider">
                    {getTeamLabel(match.homeTeam)} vs {getTeamLabel(match.awayTeam)}
                  </td>
                  <td className="px-4 py-3 text-xs font-black uppercase tracking-wider">{STAGE_LABEL[match.stage]}</td>
                  <td className="px-4 py-3 text-xs font-black uppercase tracking-wider">{match.homeGoals} - {match.awayGoals}</td>
                  <td className="px-4 py-3 text-xs font-black uppercase tracking-wider">{match.finished ? 'Finalizado' : 'Pendiente'}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(match)}
                        className="px-3 py-2 border-2 border-black text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(match.id)}
                        className="px-3 py-2 border-2 border-[#FF3E00] text-[#FF3E00] text-[10px] font-black uppercase tracking-widest hover:bg-[#FF3E00] hover:text-white transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default ResultsAdmin;
