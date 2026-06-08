import React, { useCallback, useEffect, useState } from 'react';
import { MatchResult } from '../lib/results';
import { WORLD_CUP_TEAMS } from '../lib/teams';
import { useAuth } from '../lib/AuthContext';
import { useLanguage } from '../lib/LanguageContext';
import { fetchResultsFromGist, getResultsGistUrl, ResultsSourceMeta } from '../lib/resultsSource';

type Stage = MatchResult['stage'];

interface ResultsAdminProps {
  adminUid: string;
}

const ResultsAdmin: React.FC<ResultsAdminProps> = ({ adminUid }) => {
  const { user } = useAuth();
  const { tr } = useLanguage();
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [sourceMeta, setSourceMeta] = useState<ResultsSourceMeta | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [gistUrl, setGistUrl] = useState<string | null>(null);

  const loadMatches = useCallback(async (showStatus: boolean) => {
    setStatusMessage(null);
    setErrorMessage(null);
    if (showStatus) {
      setIsSyncing(true);
    }

    try {
      const { matches: loaded, meta } = await fetchResultsFromGist();
      setMatches(loaded);
      setSourceMeta(meta);
      if (showStatus) {
        setStatusMessage(
          tr(
            `Resultados actualizados desde Gist. Partidos cargados: ${loaded.length}.`,
            `Results refreshed from Gist. Loaded matches: ${loaded.length}.`
          )
        );
      }
    } catch (error) {
      console.error('Error loading gist results:', error);
      setMatches([]);
      setSourceMeta(null);
      setErrorMessage(
        tr(
          'No se pudieron leer resultados desde Gist. Revisa VITE_RESULTS_GIST_URL y el formato JSON.',
          'Could not read results from Gist. Check VITE_RESULTS_GIST_URL and JSON format.'
        )
      );
    } finally {
      if (showStatus) {
        setIsSyncing(false);
      }
    }
  }, [tr]);

  useEffect(() => {
    try {
      setGistUrl(getResultsGistUrl());
    } catch {
      setGistUrl(null);
      setErrorMessage(
        tr(
          'Falta definir VITE_RESULTS_GIST_URL para cargar resultados.',
          'VITE_RESULTS_GIST_URL is missing, results cannot be loaded.'
        )
      );
    }
  }, [tr]);

  useEffect(() => {
    void loadMatches(false);
  }, [loadMatches]);

  const getTeamLabel = (teamId: string) => {
    const found = WORLD_CUP_TEAMS.find((team) => team.id === teamId);
    return found ? `${found.flag} ${found.name}` : teamId;
  };

  const getStageLabel = (stage: Stage) => {
    if (stage === 'groups') return tr('Grupos', 'Groups');
    if (stage === 'round32') return tr('16avos', 'Round of 32');
    if (stage === 'round16') return tr('Octavos', 'Round of 16');
    if (stage === 'quarters') return tr('Cuartos', 'Quarterfinals');
    if (stage === 'semis') return tr('Semifinal', 'Semifinals');
    return tr('Final', 'Final');
  };

  return (
    <section className="border-4 border-black bg-white p-6 md:p-8">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl md:text-3xl font-serif italic font-black uppercase">{tr('Resultados oficiales', 'Official results')}</h2>
        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{tr('Solo admin', 'Admin only')}</span>
      </div>
      <p className="mb-4 text-[10px] font-black uppercase tracking-widest opacity-60">
        {tr('Sesion', 'Session')}: {user?.uid || tr('sin login', 'not logged in')} // {tr('Admin esperado', 'Expected admin')}: {adminUid}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-2 border-black p-4 bg-[#F5F2ED]">
        <div className="border-2 border-black bg-white p-4">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">{tr('Fuente de datos', 'Data source')}</p>
          <p className="text-xs font-black uppercase tracking-widest">github gist json</p>
          <p className="mt-2 text-[10px] font-black uppercase tracking-widest opacity-60">
            {gistUrl
              ? tr('Usando URL de Gist configurada en entorno.', 'Using Gist URL configured in environment.')
              : tr('No hay URL de Gist configurada.', 'No Gist URL configured.')}
          </p>
          {gistUrl && (
            <p className="mt-2 text-[10px] font-black uppercase tracking-widest opacity-60 break-all">
              {gistUrl}
            </p>
          )}
          <p className="mt-2 text-[10px] font-black uppercase tracking-widest opacity-60">
            {sourceMeta?.source
              ? `${tr('Origen declarado', 'Declared source')}: ${sourceMeta.source}`
              : tr('Sin metadato de origen en el JSON.', 'No source metadata in JSON.')}
          </p>
        </div>

        <div className="border-2 border-black bg-white p-4">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">{tr('Ultima actualizacion', 'Last update')}</p>
          <p className="text-xs font-black uppercase tracking-widest">
            {sourceMeta?.updatedAt
              ? new Date(sourceMeta.updatedAt).toLocaleString()
              : tr('Sin fecha en JSON', 'No date in JSON')}
          </p>
          <p className="mt-2 text-[10px] font-black uppercase tracking-widest opacity-60">
            {tr('Partidos cargados', 'Loaded matches')}: {sourceMeta?.total ?? matches.length}
          </p>
        </div>

        <div className="md:col-span-2 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void loadMatches(true)}
            disabled={isSyncing || !gistUrl}
            className="px-5 py-3 bg-black text-white text-xs font-black uppercase tracking-widest hover:bg-[#FF3E00] transition-colors disabled:opacity-50"
          >
            {isSyncing ? tr('Actualizando...', 'Refreshing...') : tr('Actualizar resultados desde Gist', 'Refresh results from Gist')}
          </button>
        </div>

        {statusMessage && <p className="md:col-span-2 text-[10px] font-black uppercase tracking-widest text-green-700">{statusMessage}</p>}
        {errorMessage && <p className="md:col-span-2 text-[10px] font-black uppercase tracking-widest text-[#FF3E00]">{errorMessage}</p>}
      </div>

      <div className="mt-6 border-2 border-black overflow-x-auto">
        <table className="w-full min-w-190 text-left">
          <thead className="bg-black text-white text-[10px] font-black uppercase tracking-[0.2em]">
            <tr>
              <th className="px-4 py-3">Partido</th>
              <th className="px-4 py-3">{tr('Fase', 'Stage')}</th>
              <th className="px-4 py-3">{tr('Resultado', 'Result')}</th>
              <th className="px-4 py-3">{tr('Estado', 'Status')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/10 bg-white">
            {matches.length === 0 ? (
              <tr>
                <td className="px-4 py-4 text-xs font-black uppercase tracking-widest opacity-50" colSpan={4}>
                  {tr('No hay resultados cargados aun.', 'No results yet.')}
                </td>
              </tr>
            ) : (
              matches.map((match) => (
                <tr key={match.id} className="hover:bg-[#F5F2ED]">
                  <td className="px-4 py-3 text-xs font-black uppercase tracking-wider">
                    {getTeamLabel(match.homeTeam)} vs {getTeamLabel(match.awayTeam)}
                  </td>
                  <td className="px-4 py-3 text-xs font-black uppercase tracking-wider">{getStageLabel(match.stage)}</td>
                  <td className="px-4 py-3 text-xs font-black uppercase tracking-wider">{match.homeGoals} - {match.awayGoals}</td>
                  <td className="px-4 py-3 text-xs font-black uppercase tracking-wider">{match.finished ? tr('Finalizado', 'Finished') : tr('Pendiente', 'Pending')}</td>
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
