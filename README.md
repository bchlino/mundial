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

If you still get permission-denied, verify the authenticated user UID is the same adminId used when creating match documents.

