export interface Team {
  id: string;
  name: string;
  flag: string;
  pot: 'A' | 'B' | 'C' | 'D';
}

export interface WorldCupGroup {
  id: string;
  teams: Team[];
}

export const WORLD_CUP_TEAMS: Team[] = [
  // Pot A - Elite
  { id: 'argentina', name: 'Argentina', flag: '🇦🇷', pot: 'A' },
  { id: 'france', name: 'Francia', flag: '🇫🇷', pot: 'A' },
  { id: 'spain', name: 'España', flag: '🇪🇸', pot: 'A' },
  { id: 'england', name: 'Inglaterra', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', pot: 'A' },
  { id: 'brazil', name: 'Brasil', flag: '🇧🇷', pot: 'A' },
  { id: 'belgium', name: 'Bélgica', flag: '🇧🇪', pot: 'A' },
  { id: 'portugal', name: 'Portugal', flag: '🇵🇹', pot: 'A' },
  { id: 'netherlands', name: 'Países Bajos', flag: '🇳🇱', pot: 'A' },
  { id: 'colombia', name: 'Colombia', flag: '🇨🇴', pot: 'A' },
  { id: 'germany', name: 'Alemania', flag: '🇩🇪', pot: 'A' },
  { id: 'morocco', name: 'Marruecos', flag: '🇲🇦', pot: 'A' },
  { id: 'uruguay', name: 'Uruguay', flag: '🇺🇾', pot: 'A' },

  // Pot B - Strong
  { id: 'croatia', name: 'Croacia', flag: '🇭🇷', pot: 'B' },
  { id: 'usa', name: 'EE.UU.', flag: '🇺🇸', pot: 'B' },
  { id: 'japan', name: 'Japón', flag: '🇯🇵', pot: 'B' },
  { id: 'senegal', name: 'Senegal', flag: '🇸🇳', pot: 'B' },
  { id: 'switzerland', name: 'Suiza', flag: '🇨🇭', pot: 'B' },
  { id: 'iran', name: 'Irán', flag: '🇮🇷', pot: 'B' },
  { id: 'mexico', name: 'México', flag: '🇲🇽', pot: 'B' },
  { id: 'egypt', name: 'Egipto', flag: '🇪🇬', pot: 'B' },
  { id: 'sweden', name: 'Suecia', flag: '🇸🇪', pot: 'B' },
  { id: 'ecuador', name: 'Ecuador', flag: '🇪🇨', pot: 'B' },
  { id: 'austria', name: 'Austria', flag: '🇦🇹', pot: 'B' },
  { id: 'south-korea', name: 'Corea del Sur', flag: '🇰🇷', pot: 'B' },

  // Pot C - Competitive Middle
  { id: 'australia', name: 'Australia', flag: '🇦🇺', pot: 'C' },
  { id: 'norway', name: 'Noruega', flag: '🇳🇴', pot: 'C' },
  { id: 'turkey', name: 'Turquía', flag: '🇹🇷', pot: 'C' },
  { id: 'algeria', name: 'Argelia', flag: '🇩🇿', pot: 'C' },
  { id: 'panama', name: 'Panamá', flag: '🇵🇦', pot: 'C' },
  { id: 'tunisia', name: 'Túnez', flag: '🇹🇳', pot: 'C' },
  { id: 'scotland', name: 'Escocia', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', pot: 'C' },
  { id: 'czech-republic', name: 'Rep. Checa', flag: '🇨🇿', pot: 'C' },
  { id: 'paraguay', name: 'Paraguay', flag: '🇵🇾', pot: 'C' },
  { id: 'cote-divoire', name: 'Costa de Marfil', flag: '🇨🇮', pot: 'C' },
  { id: 'canada', name: 'Canadá', flag: '🇨🇦', pot: 'C' },
  { id: 'saudi-arabia', name: 'Arabia Saudita', flag: '🇸🇦', pot: 'C' },

  // Pot D - Challengers
  { id: 'iraq', name: 'Irak', flag: '🇮🇶', pot: 'D' },
  { id: 'uzbekistan', name: 'Uzbekistán', flag: '🇺🇿', pot: 'D' },
  { id: 'cape-verde', name: 'Cabo Verde', flag: '🇨🇻', pot: 'D' },
  { id: 'rd-congo', name: 'RD Congo', flag: '🇨🇩', pot: 'D' },
  { id: 'jordan', name: 'Jordania', flag: '🇯🇴', pot: 'D' },
  { id: 'bosnia', name: 'Bosnia', flag: '🇧🇦', pot: 'D' },
  { id: 'south-africa', name: 'Sudáfrica', flag: '🇿🇦', pot: 'D' },
  { id: 'ghana', name: 'Ghana', flag: '🇬🇭', pot: 'D' },
  { id: 'qatar', name: 'Qatar', flag: '🇶🇦', pot: 'D' },
  { id: 'haiti', name: 'Haití', flag: '🇭🇹', pot: 'D' },
  { id: 'curacao', name: 'Curazao', flag: '🇨🇼', pot: 'D' },
  { id: 'new-zealand', name: 'Nueva Zelanda', flag: '🇳🇿', pot: 'D' },
];

const GROUP_IDS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

const teamsByPot: Record<'A' | 'B' | 'C' | 'D', Team[]> = {
  A: WORLD_CUP_TEAMS.filter((team) => team.pot === 'A'),
  B: WORLD_CUP_TEAMS.filter((team) => team.pot === 'B'),
  C: WORLD_CUP_TEAMS.filter((team) => team.pot === 'C'),
  D: WORLD_CUP_TEAMS.filter((team) => team.pot === 'D'),
};

export const WORLD_CUP_GROUPS: WorldCupGroup[] = GROUP_IDS.map((groupId, index) => ({
  id: groupId,
  teams: [
    teamsByPot.A[index],
    teamsByPot.B[index],
    teamsByPot.C[index],
    teamsByPot.D[index],
  ].filter(Boolean),
}));
