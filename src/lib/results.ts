// Modelo de resultados de partidos para el scoring funcional
// Cada documento: id = matchId
export interface MatchResult {
  id: string; // partido_unico_id
  homeTeam: string; // id equipo
  awayTeam: string; // id equipo
  homeGoals: number;
  awayGoals: number;
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
    if (match.stage === 'round32') points += goalsFor > goalsAgainst ? 4 : 0;
    else if (match.stage === 'round16') points += goalsFor > goalsAgainst ? 6 : 0;
    else if (match.stage === 'quarters') points += goalsFor > goalsAgainst ? 8 : 0;
    else if (match.stage === 'semis') points += goalsFor > goalsAgainst ? 10 : 0;
    else if (match.stage === 'final') points += goalsFor > goalsAgainst ? 12 : 0;
  }
  return points;
}
