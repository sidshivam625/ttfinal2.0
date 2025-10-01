Firebase Functions (asia-south1)

All exported functions in `src/index.ts` use `functions.region('asia-south1')`.

Setup

```
cd backend/functions
npm ci
```

Local emulation

```
npm run build
npm run serve
```

Deploy (functions only)

```
npm run build
firebase deploy --only functions --project <YOUR_PROJECT_ID>
```

Auth & project selection

```
firebase login
firebase use <YOUR_PROJECT_ID>
```

