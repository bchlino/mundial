#!/usr/bin/env node

function requireEnv(name) {
  const value = String(process.env[name] || "").trim();
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function normalizeName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

const TEAM_ALIASES = {
  argentina: "argentina",
  france: "france",
  francia: "france",
  spain: "spain",
  espana: "spain",
  england: "england",
  brazil: "brazil",
  brasil: "brazil",
  belgium: "belgium",
  belgica: "belgium",
  portugal: "portugal",
  netherlands: "netherlands",
  paisesbajos: "netherlands",
  colombia: "colombia",
  germany: "germany",
  alemania: "germany",
  morocco: "morocco",
  marruecos: "morocco",
  uruguay: "uruguay",
  croatia: "croatia",
  croacia: "croatia",
  usa: "usa",
  unitedstates: "usa",
  eeuu: "usa",
  japan: "japan",
  japon: "japan",
  senegal: "senegal",
  switzerland: "switzerland",
  suiza: "switzerland",
  iran: "iran",
  mexico: "mexico",
  egypt: "egypt",
  egipto: "egypt",
  sweden: "sweden",
  suecia: "sweden",
  ecuador: "ecuador",
  austria: "austria",
  southkorea: "south-korea",
  korearepublic: "south-korea",
  republicofkorea: "south-korea",
  coreadelsur: "south-korea",
  australia: "australia",
  norway: "norway",
  noruega: "norway",
  turkey: "turkey",
  turkiye: "turkey",
  turquia: "turkey",
  algeria: "algeria",
  argelia: "algeria",
  panama: "panama",
  tunisia: "tunisia",
  tunez: "tunisia",
  scotland: "scotland",
  escocia: "scotland",
  czechrepublic: "czech-republic",
  czechia: "czech-republic",
  repcheca: "czech-republic",
  paraguay: "paraguay",
  cotedivoire: "cote-divoire",
  ivorycoast: "cote-divoire",
  costademarfil: "cote-divoire",
  canada: "canada",
  saudiarabia: "saudi-arabia",
  arabiasaudita: "saudi-arabia",
  iraq: "iraq",
  uzbekistan: "uzbekistan",
  capeverde: "cape-verde",
  caboverde: "cape-verde",
  drcongo: "rd-congo",
  rdcongo: "rd-congo",
  jordan: "jordan",
  bosnia: "bosnia",
  southafrica: "south-africa",
  sudafrica: "south-africa",
  ghana: "ghana",
  qatar: "qatar",
  haiti: "haiti",
  curacao: "curacao",
  newzealand: "new-zealand",
  nuevazelanda: "new-zealand",
};

function mapTeamNameToId(name) {
  return TEAM_ALIASES[normalizeName(name)] || null;
}

function mapStage(stageValue) {
  const stage = String(stageValue || "").toUpperCase();
  if (stage === "GROUP_STAGE" || stage === "GROUPS") return "groups";
  if (stage === "LAST_16" || stage === "ROUND_OF_16") return "round16";
  if (stage === "QUARTER_FINALS" || stage === "QUARTERFINALS") return "quarters";
  if (stage === "SEMI_FINALS" || stage === "SEMIFINALS") return "semis";
  if (stage === "FINAL") return "final";
  return "groups";
}

function buildApiUrl() {
  const baseUrl = String(process.env.FOOTBALL_DATA_BASE_URL || "https://api.football-data.org/v4").trim();
  const competitionCode = String(process.env.FOOTBALL_DATA_COMPETITION_CODE || "WC").trim();
  const season = String(process.env.FOOTBALL_DATA_SEASON || "2026").trim();
  const status = String(process.env.FOOTBALL_DATA_STATUS || "FINISHED").trim();

  const url = new URL(`${baseUrl.replace(/\/$/, "")}/competitions/${encodeURIComponent(competitionCode)}/matches`);
  url.searchParams.set("season", season);
  if (status) {
    url.searchParams.set("status", status);
  }
  return url.toString();
}

async function fetchFootballDataMatches() {
  const apiToken = requireEnv("FOOTBALL_DATA_API_TOKEN");
  const endpoint = buildApiUrl();

  const response = await fetch(endpoint, {
    headers: {
      "X-Auth-Token": apiToken,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`football-data request failed (${response.status}): ${body.slice(0, 500)}`);
  }

  const data = await response.json();
  if (!Array.isArray(data?.matches)) {
    throw new Error("Unexpected football-data payload: matches is not an array");
  }

  return data.matches;
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function transformMatches(rawMatches) {
  const transformed = [];
  const skipped = [];

  for (const item of rawMatches) {
    const apiFixtureId = item?.id;
    const homeName = item?.homeTeam?.name;
    const awayName = item?.awayTeam?.name;
    const homeTeam = mapTeamNameToId(homeName);
    const awayTeam = mapTeamNameToId(awayName);

    if (!homeTeam || !awayTeam) {
      skipped.push({
        fixtureId: apiFixtureId || null,
        homeName: homeName || null,
        awayName: awayName || null,
      });
      continue;
    }

    transformed.push({
      id: `fd-${apiFixtureId}`,
      homeTeam,
      awayTeam,
      homeGoals: toNumber(item?.score?.fullTime?.home),
      awayGoals: toNumber(item?.score?.fullTime?.away),
      stage: mapStage(item?.stage),
      finished: String(item?.status || "") === "FINISHED",
    });
  }

  return { transformed, skipped };
}

async function updateGist(content) {
  const gistId = requireEnv("GIST_ID");
  const gistToken = requireEnv("GIST_TOKEN");
  const gistFileName = String(process.env.GIST_FILE_NAME || "matches.json").trim();

  const body = {
    files: {
      [gistFileName]: {
        content: JSON.stringify(content, null, 2),
      },
    },
  };

  const response = await fetch(`https://api.github.com/gists/${gistId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${gistToken}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gist update failed (${response.status}): ${errorBody.slice(0, 500)}`);
  }
}

async function main() {
  const rawMatches = await fetchFootballDataMatches();
  const { transformed, skipped } = transformMatches(rawMatches);

  const output = {
    updatedAt: new Date().toISOString(),
    source: String(process.env.RESULTS_SOURCE_NAME || "football-data.org"),
    meta: {
      provider: "football-data.org",
      fetched: rawMatches.length,
      included: transformed.length,
      skipped: skipped.length,
    },
    matches: transformed,
  };

  await updateGist(output);

  console.log(`Updated gist with ${transformed.length} matches. Skipped: ${skipped.length}.`);
  if (skipped.length > 0) {
    console.log("Skipped teams not mapped to app IDs:");
    console.log(JSON.stringify(skipped.slice(0, 20), null, 2));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
