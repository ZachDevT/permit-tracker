# ⚡ Fix Rapide 404 Vercel

## 🎯 Solution la Plus Probable

L'erreur 404 est **probablement due aux variables d'environnement manquantes ou incorrectes**.

### ✅ Étapes Rapides

1. **Vérifiez les Variables dans Vercel :**
   - Dashboard Vercel → Votre projet → **Settings** → **Environment Variables**
   - Assurez-vous que **TOUTES** ces variables sont présentes :
     - `NEXT_PUBLIC_FIREBASE_API_KEY`
     - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
     - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
     - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
     - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
     - `NEXT_PUBLIC_FIREBASE_APP_ID`
     - `FIREBASE_PROJECT_ID`
     - `FIREBASE_CLIENT_EMAIL`
     - `FIREBASE_PRIVATE_KEY` ⚠️ (avec guillemets et `\n`)
     - `FIREBASE_STORAGE_BUCKET`

2. **Vérifiez que les Variables sont pour Production :**
   - Chaque variable doit avoir **Production** coché
   - Cliquez sur chaque variable et vérifiez

3. **Redéployez :**
   - Dans Vercel Dashboard → **Deployments**
   - Cliquez sur **"Redeploy"** du dernier déploiement

### 🔍 Vérifier les Logs

1. Vercel Dashboard → **Deployments** → Ouvrez le dernier
2. Regardez les **"Build Logs"**
3. Cherchez des erreurs comme :
   - "Firebase Admin credentials are missing"
   - "Environment variable not found"

### ⚡ Solution Express

Si vous avez ajouté les variables mais que ça ne marche toujours pas :

1. **Supprimez toutes les variables**
2. **Ajoutez-les à nouveau** (une par une)
3. **Redéployez**

### 📋 Copier-Coller des Variables

Depuis votre `.env.local`, copiez exactement :

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDf4_rbJHKKBL1xV4zqH-hJ2GW8lYI4QdQ
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=permit-tracker-8f6bb.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=permit-tracker-8f6bb
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=permit-tracker-8f6bb.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=403751183886
NEXT_PUBLIC_FIREBASE_APP_ID=1:403751183886:web:638cba1021c64aad887e5f
FIREBASE_PROJECT_ID=permit-tracker-8f6bb
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@permit-tracker-8f6bb.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDf/xSRRvafLmUR\nUTs9KNSQGPYWOgMVa1NlRKEwhntfZ7ztmBTCPV9BlkG1h9KDdiE/zHa1GS74CXIA\nlI9xhICWI4YbMau5YwwVJK6/HGeANpQZNBFYB06j295gTaQ/2yiFDlZZNBzEL9t0\n0sMiCmeA8fFYiNpVJaBaiWSs7MvwXlOUm7NvqlvlykJM1WC4lyJHwGntpfV+Ofhp\ndLKwhXoJKFQoRPIDnhevwLWjWyZoJJddrMxgGLzqt6Dpvu74F36r8LhoAh6uUWw0\nc1Y+C3k66L0umXSwhls5wouQvq6idCidBRCpClP36G/7hXDbMKR3dB76yzFmpAYr\nPYsgscDhAgMBAAECggEABB/Dio20jHd7laMp3K1H5ZvKCxx4ElDCrTCDabvuIVJt\nAnBcgHuGCZR5Qvz8UZ6PC+hJLronGNq+qjdSAUhr4CfJCC7kzyHdVvXREFR27N/E\nYAbrA1SGHIL3sAz551GTCEkcaqHInk2VxCu9uz6XC4MY2xUQ9QSfdE9Hht4IvrUL\nDmRyeTMVRfDyJgsLljnCNKN/iWUh2DuTE1QrCkgHqDGHsVibEc4r0H0Q6t7lT8yo\n+AVD1dp4DAoMXqnMS3aN5bz2GgnJ3gixMC+FxJ387x8TSSt4t7/poDmlT57ZaoxS\nRu3J69wiW6uA7Gi+qJ5wjcYiZVDZuFjxsR8ZQtnHuQKBgQD98R7KeOw36r+pqIBb\nnJsmzu/K/DdgiF0LHZSufqtFqzoEP0eNr8mcuOl3NEEXpohYGC+gDdaRIzYfRYCN\nMlCOUL2HhK+dTQurtHiL/Ky9JsFEIlaHfWWJcAJqjM9gnXDA3th5u7LhkjsnHFR9\n+WZPqrpKqUKwmE6GrK/pZvOtKQKBgQDhz9Q+P5T121Ro2tEN20f6OINbUAU4Fq+J\n1uVEyEKnhgQwYJX7FmJxwRwOrzbfe3hjTPiaOP/rA99NI751Bh7o3liXjEeSk4QH\nBEVf9YVWWbA0Vb9bXvcMyv4Ly7RQ4QcnuRF9ulTUAbmR+uwWeX3qkTpB6SZ6ByHN\nPOFoWLI0+QKBgC7ZnF+ofZQ3aBLp9nxwYSOAzDa734+cuOXDGFo1Hm4lD/gWoKHg\nS6bxaolGh7fQTplKJQc3Zl2yjFqqnPPv03LeLIljDm9L9ppAGnlhLZFcJA3o8+Pd\nW61Gj/uObPgbM+Exe+jBm1gIfYdSr7fqGlkaW3JI1ff0sZAhLfc2ukA5AoGBAKgA\njyFM/s+4QeHNQxIzHicNGrW6IFftkOZVqrf04ppuu/keMxffPJjzmqNWOtYkr5n5\nr1BWrhi1BdMHj/DS//YzTuhZpvpnpCfwRokxSuXGzrDxRvB9BANRl5dBFEPEWCV2\nrIvFMM2XBvCUJkhGVadKK3TUORs66SwganfO3a9JAoGBAPlSBOE/oqmHmV9DfpJh\nsRSPg77UijvLe3BtGTGbIVhBHX5dP0H/r8uMAZL2hAG+XS5InQVX5j9CAXHTKsAI\nwm9/bwlI/h+6l2GHfqCxR8lWRgRUA+iiJ6YGJK/7HSSxgRUrtChChrewGPYrMJgv\nppSF2DqB771d1P/r0lozgcQ+\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=permit-tracker-8f6bb.firebasestorage.app
```

**⚠️ Important pour FIREBASE_PRIVATE_KEY :**
- Gardez les guillemets `"`
- Gardez tous les `\n` (ne les remplacez pas par de vraies nouvelles lignes)

---

**Après avoir ajouté les variables, redéployez !**

