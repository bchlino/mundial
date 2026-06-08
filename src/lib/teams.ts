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

const OFFICIAL_GROUP_TEAM_IDS: Array<{ id: string; teamIds: string[] }> = [
  { id: 'A', teamIds: ['mexico', 'south-africa', 'south-korea', 'czech-republic'] },
  { id: 'B', teamIds: ['canada', 'bosnia', 'qatar', 'switzerland'] },
  { id: 'C', teamIds: ['brazil', 'morocco', 'haiti', 'scotland'] },
  { id: 'D', teamIds: ['usa', 'paraguay', 'australia', 'turkey'] },
  { id: 'E', teamIds: ['germany', 'curacao', 'cote-divoire', 'ecuador'] },
  { id: 'F', teamIds: ['netherlands', 'japan', 'sweden', 'tunisia'] },
  { id: 'G', teamIds: ['belgium', 'egypt', 'iran', 'new-zealand'] },
  { id: 'H', teamIds: ['spain', 'cape-verde', 'saudi-arabia', 'uruguay'] },
  { id: 'I', teamIds: ['france', 'senegal', 'iraq', 'norway'] },
  { id: 'J', teamIds: ['argentina', 'algeria', 'austria', 'jordan'] },
  { id: 'K', teamIds: ['portugal', 'rd-congo', 'uzbekistan', 'colombia'] },
  { id: 'L', teamIds: ['england', 'croatia', 'ghana', 'panama'] },
];

export const WORLD_CUP_GROUPS: WorldCupGroup[] = OFFICIAL_GROUP_TEAM_IDS.map((group) => ({
  id: group.id,
  teams: group.teamIds
    .map((teamId) => WORLD_CUP_TEAMS.find((team) => team.id === teamId))
    .filter(Boolean) as Team[],
}));
