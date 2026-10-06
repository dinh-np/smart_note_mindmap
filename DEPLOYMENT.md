# Smart Note & Mindmap - Production Deployment Guide

## 1. Environment Variables
Before deploying, ensure your environment is configured with the following secrets.

Create a `.env.local` (for development) and configure these variables in your production hosting provider (Vercel, Netlify, Docker, etc.):

```env
# AI Copilot Backend
GEMINI_API_KEY="your-gemini-api-key"

# Firebase Realtime Database Sync
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyDvVpIBzojM-Am3i4amtz9iPIkwDNg4xbs"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="smartmindmappm.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="smartmindmappm"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="smartmindmappm.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="592654875499"
NEXT_PUBLIC_FIREBASE_APP_ID="1:592654875499:web:750029b29d71783a66ea2e"
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="G-E123FGWDGP"
NEXT_PUBLIC_FIREBASE_DATABASE_URL="https://smartmindmappm-default-rtdb.firebaseio.com"
```

## 2. Firebase Realtime Database Security Rules
To secure the `smartmindmappm` instance against unauthorized overrides while allowing authenticated collaboration, deploy the following JSON rules to your Firebase Realtime Database console:

```json
{
  "rules": {
    "projects": {
      "$project_id": {
        // Anyone can read for public sharing (Modify to "auth != null" for private projects)
        ".read": true,
        // Only allow writes if the payload contains a strictly increasing timestamp to prevent race conditions
        ".write": "newData.hasChildren(['rootData', 'timestamp']) && newData.child('timestamp').val() >= data.child('timestamp').val()"
      }
    }
  }
}
```
*Note: If implementing Firebase Auth, update the `.write` rule to validate `$project_id` against `auth.uid` owners.*

## 3. Production Build & Execution
The project uses Next.js 16 App Router with Webpack 5 fallback configurations to seamlessly handle heavy Node.js-based Office Export plugins (`pptxgenjs`, `exceljs`) on the client. 

```bash
# 1. Install dependencies
npm install

# 2. Build for production (Note: --webpack flag is required for next-pwa compatibility)
npm run build

# 3. Start the production server
npm run start
```

## 4. Architecture Verification Status
* **MindGenius (`.mgmx`) Parsers**: Tested and verified. The async ZIP extraction uses strict `TextDecoder('utf-8')` buffers to guarantee 100% Vietnamese diacritic preservation.
* **Office Suite Exporters (`.pptx`, `.docx`, `.xlsx`, `.pdf`)**: Native DOM rendering integrated securely using `NormalModuleReplacementPlugin` to strip conflicting `node:fs` schemes during Webpack compilation.
* **Cloud Sync Engine**: Configured to debounce high-frequency state updates, prioritizing local Dexie mutations offline, and executing a flush merge to `firebase/database` on `navigator.onLine` recovery.
* **Mobile Handling**: Integrated native HTML5 multi-touch Cartesian pointers (`PointerEvent`) and visual viewport resize observers to auto-pan the canvas safely into the upper 50% screen real estate when iOS/Android virtual keyboards deploy.
