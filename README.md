<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/7fa329ab-277a-4814-8389-2d566b4df846

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Firebase in Vercel

Vercel hosts your frontend, but Firestore security rules are enforced in Firebase.

1. In Vercel, go to Project Settings > Environment Variables and add:
   - VITE_FIREBASE_API_KEY
   - VITE_FIREBASE_AUTH_DOMAIN
   - VITE_FIREBASE_PROJECT_ID
   - VITE_FIREBASE_APP_ID
   - VITE_FIREBASE_STORAGE_BUCKET
   - VITE_FIREBASE_MESSAGING_SENDER_ID
   - VITE_FIREBASE_MEASUREMENT_ID
   - VITE_FIREBASE_DATABASE_ID

2. Use these values from firebase-applet-config.json:
   - projectId: gen-lang-client-0384172144
   - firestoreDatabaseId: ai-studio-7fa329ab-277a-4814-8389-2d566b4df846

3. In Firebase Console > Authentication > Settings > Authorized domains, add your Vercel domain(s):
   - your-project.vercel.app
   - your custom domain (if any)

4. Deploy Firestore rules to Firebase (not Vercel):
   - npx -y firebase-tools login
   - npx -y firebase-tools deploy --only firestore --project gen-lang-client-0384172144

## Resultados via GitHub Gist (sin guardar en Firestore)

Flujo implementado:

GitHub Gist JSON
   -> Frontend

### 1) Crear o elegir un Gist

Puedes usar un Gist propio o uno publico de terceros.

Recomendado: Gist propio para controlar formato y disponibilidad.

Formato JSON compatible:

```json
{
   "updatedAt": "2026-06-08T12:00:00Z",
   "source": "manual",
   "matches": [
      {
         "id": "wc-2026-001",
         "homeTeam": "argentina",
         "awayTeam": "france",
         "homeGoals": 2,
         "awayGoals": 1,
         "stage": "final",
         "finished": true
      }
   ]
}
```

Tambien se acepta un array plano de partidos como raiz del JSON.

### 2) Configurar variables de entorno en frontend

Agregar en `.env.local` (o en Vercel):

- VITE_RESULTS_GIST_URL=https://gist.githubusercontent.com/USER/GIST_ID/raw/FILE.json
- VITE_RESULTS_REFRESH_MS=300000

Notas:

- `VITE_RESULTS_GIST_URL` es obligatoria.
- `VITE_RESULTS_REFRESH_MS` es opcional (en milisegundos). Default: 300000 (5 min).

### 3) Uso desde frontend admin

En resultados admin existe el boton "Actualizar resultados desde Gist".

La app:

- lee el JSON del Gist,
- normaliza campos de marcador/fase,
- muestra tabla y usa esos partidos para calcular puntajes.

No se escriben resultados en Firestore (`matches` y `system/sportsSync` ya no son necesarios para este flujo).

### 4) Automatizar Gist desde GitHub Actions

Se agrego:

- Script: `scripts/update-worldcup-gist.mjs`
- Workflow: `.github/workflows/update-worldcup.yml`

#### Secrets requeridos (GitHub repo)

- `FOOTBALL_DATA_API_TOKEN`: token de football-data.org v4.
- `GIST_ID`: id del gist donde se publica el JSON.
- `GIST_TOKEN`: token de GitHub con permiso para editar gists.

#### Variables opcionales (GitHub repo -> Variables)

- `FOOTBALL_DATA_BASE_URL` (default: `https://api.football-data.org/v4`)
- `FOOTBALL_DATA_COMPETITION_CODE` (default: `WC`)
- `FOOTBALL_DATA_SEASON` (default: `2026`)
- `FOOTBALL_DATA_STATUS` (default: `FINISHED`)
- `GIST_FILE_NAME` (default: `matches.json`)
- `RESULTS_SOURCE_NAME` (default: `football-data.org`)

#### Ejecutar manualmente

- En GitHub: Actions -> `Update World Cup Gist` -> Run workflow.
- En local: `npm run results:update-gist` (con variables de entorno cargadas).

#### Consumir desde Vercel

En Vercel deja configurado:

- `VITE_RESULTS_GIST_URL` apuntando al raw del archivo del gist (ejemplo: `https://gist.githubusercontent.com/USER/GIST_ID/raw/matches.json`).

Con eso el frontend cargara los resultados sin usar Firestore para matches.

