// Modelo de resultados de partidos para el scoring funcional
// Cada documento: id = matchId
export interface MatchResult {
  id: string; // partido_unico_id
  homeTeam: string; // id equipo
  awayTeam: string; // id equipo
  homeGoals: number;
  awayGoals: number;
  winner?: string; // id equipo ganador (recomendado en eliminatorias)
  stage: 'groups' | 'round32' | 'round16' | 'quarters' | 'semis' | 'final';
  finished: boolean;
}

// Ejemplo de estructura en Firestore:
// matches/{id} => { homeTeam, awayTeam, homeGoals, awayGoals, stage, finished }

// Utilidad para calcular puntos por partido
export function getMatchPoints(teamId: string, match: MatchResult): number {
  if (!match.finished) return 0;
  let points = 0;
  const isHome = match.homeTeam === teamId;
  const isAway = match.awayTeam === teamId;
  if (!isHome && !isAway) return 0;
  const goalsFor = isHome ? match.homeGoals : match.awayGoals;
  const goalsAgainst = isHome ? match.awayGoals : match.homeGoals;

  // Fase de grupos
  if (match.stage === 'groups') {
    if (goalsFor > goalsAgainst) points += 3;
    else if (goalsFor === goalsAgainst) points += 1;
    // derrota = 0
  }
  // Eliminatorias
  else {
    const winnerByGoals = match.homeGoals !== match.awayGoals
      ? (match.homeGoals > match.awayGoals ? match.homeTeam : match.awayTeam)
      : undefined;
    const winnerId = match.winner || winnerByGoals;
    const advances = winnerId === teamId;

    if (match.stage === 'round32') points += advances ? 4 : 0;
    else if (match.stage === 'round16') points += advances ? 6 : 0;
    else if (match.stage === 'quarters') points += advances ? 8 : 0;
    else if (match.stage === 'semis') points += advances ? 10 : 0;
    else if (match.stage === 'final') points += advances ? 12 : 0;
  }
  return points;
}
