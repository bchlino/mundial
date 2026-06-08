const admin = require("firebase-admin");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");

admin.initializeApp();

const db = admin.firestore();

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

function normalizeName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

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
  return null;
}

function getApiConfig() {
  return {
    token: process.env.SPORTS_API_TOKEN,
    baseUrl: process.env.SPORTS_API_BASE_URL || "https://api.football-data.org/v4",
    competitionCode: process.env.SPORTS_COMPETITION_CODE || "WC",
    season: process.env.SPORTS_SEASON || "2026",
  };
}

async function assertUserIsLeagueAdmin(uid) {
  const snapshot = await db.collection("leagues").where("adminId", "==", uid).limit(1).get();
  if (snapshot.empty) {
    throw new HttpsError("permission-denied", "Solo admins de al menos una liga pueden sincronizar resultados.");
  }
}

async function fetchMatchesFromProvider(config) {
  if (!config.token) {
    throw new HttpsError("failed-precondition", "Falta SPORTS_API_TOKEN en variables de entorno de Functions.");
  }

  const endpoint = `${config.baseUrl}/competitions/${encodeURIComponent(config.competitionCode)}/matches?status=FINISHED&season=${encodeURIComponent(config.season)}`;

  const response = await fetch(endpoint, {
    headers: {
      "X-Auth-Token": config.token,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new HttpsError(
      "unavailable",
      `Error consultando API deportiva (${response.status}).`,
      { endpoint, body: body.slice(0, 500) }
    );
  }

  const payload = await response.json();
  return Array.isArray(payload.matches) ? payload.matches : [];
}

async function upsertMatches(rawMatches, triggerType) {
  let processed = 0;
  let upserted = 0;
  let skipped = 0;
  const skippedItems = [];

  const batch = db.batch();

  for (const item of rawMatches) {
    processed += 1;

    const homeTeamId = mapTeamNameToId(item?.homeTeam?.name);
    const awayTeamId = mapTeamNameToId(item?.awayTeam?.name);
    const stage = mapStage(item?.stage);
    const homeGoals = item?.score?.fullTime?.home;
    const awayGoals = item?.score?.fullTime?.away;

    if (!homeTeamId || !awayTeamId || !stage || typeof homeGoals !== "number" || typeof awayGoals !== "number") {
      skipped += 1;
      skippedItems.push({
        id: item?.id ?? null,
        stage: item?.stage ?? null,
        homeTeam: item?.homeTeam?.name ?? null,
        awayTeam: item?.awayTeam?.name ?? null,
      });
      continue;
    }

    const docId = `fd-${item.id}`;
    const ref = db.collection("matches").doc(docId);

    batch.set(ref, {
      homeTeam: homeTeamId,
      awayTeam: awayTeamId,
      homeGoals,
      awayGoals,
      stage,
      finished: true,
      source: "football-data.org",
      sourceMatchId: String(item.id),
      utcDate: item.utcDate || null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    upserted += 1;
  }

  await batch.commit();

  const summary = {
    processed,
    upserted,
    skipped,
    skippedItems: skippedItems.slice(0, 25),
    triggerType,
    lastRunAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await db.collection("system").doc("sportsSync").set(summary, { merge: true });

  return { processed, upserted, skipped, skippedItems: skippedItems.slice(0, 10) };
}

async function runSync(triggerType) {
  const config = getApiConfig();
  const matches = await fetchMatchesFromProvider(config);
  return upsertMatches(matches, triggerType);
}

exports.syncMatchResults = onCall({
  region: "us-central1",
  timeoutSeconds: 120,
}, async (request) => {
  throw new HttpsError(
    "failed-precondition",
    "syncMatchResults fue deshabilitada. La app ahora usa resultados desde GitHub Gist (VITE_RESULTS_GIST_URL)."
  );
});

exports.syncMatchResultsScheduled = onSchedule({
  schedule: "every 30 minutes",
  timeZone: "UTC",
  region: "us-central1",
  timeoutSeconds: 120,
}, async () => {
  console.info("syncMatchResultsScheduled deshabilitada: resultados migrados a GitHub Gist.");
});
