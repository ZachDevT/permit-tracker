# 🚀 Déploiement sur Vercel - Guide Complet

## ✅ Pourquoi Vercel ?

- ✅ **Le plus simple** : Une seule commande
- ✅ **Optimisé pour Next.js** : Créé par l'équipe Next.js
- ✅ **Routes API automatiques** : Tout fonctionne sans configuration
- ✅ **Gratuit** : Tier gratuit généreux
- ✅ **CDN global** : Performance optimale
- ✅ **SSL automatique** : Certificats HTTPS inclus

## 🎯 Déploiement en 3 Étapes

### Étape 1: Se connecter à Vercel

```bash
vercel login
```

Cela ouvrira votre navigateur pour vous connecter.

### Étape 2: Déployer

```bash
vercel --prod
```

Ou utilisez le script :

```bash
./deploy.sh
```

### Étape 3: Configurer les Variables d'Environnement

1. Allez sur : https://vercel.com/dashboard
2. Sélectionnez votre projet
3. **Settings** → **Environment Variables**
4. Ajoutez toutes les variables depuis `.env.local`

## 📋 Variables d'Environnement à Ajouter

Copiez ces variables depuis `.env.local` vers Vercel :

### Client-side (NEXT_PUBLIC_*)
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDf4_rbJHKKBL1xV4zqH-hJ2GW8lYI4QdQ
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=permit-tracker-8f6bb.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=permit-tracker-8f6bb
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=permit-tracker-8f6bb.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=403751183886
NEXT_PUBLIC_FIREBASE_APP_ID=1:403751183886:web:638cba1021c64aad887e5f
```

### Server-side (Admin)
```
FIREBASE_PROJECT_ID=permit-tracker-8f6bb
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@permit-tracker-8f6bb.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDf/xSRRvafLmUR\nUTs9KNSQGPYWOgMVa1NlRKEwhntfZ7ztmBTCPV9BlkG1h9KDdiE/zHa1GS74CXIA\nlI9xhICWI4YbMau5YwwVJK6/HGeANpQZNBFYB06j295gTaQ/2yiFDlZZNBzEL9t0\n0sMiCmeA8fFYiNpVJaBaiWSs7MvwXlOUm7NvqlvlykJM1WC4lyJHwGntpfV+Ofhp\ndLKwhXoJKFQoRPIDnhevwLWjWyZoJJddrMxgGLzqt6Dpvu74F36r8LhoAh6uUWw0\nc1Y+C3k66L0umXSwhls5wouQvq6idCidBRCpClP36G/7hXDbMKR3dB76yzFmpAYr\nPYsgscDhAgMBAAECggEABB/Dio20jHd7laMp3K1H5ZvKCxx4ElDCrTCDabvuIVJt\nAnBcgHuGCZR5Qvz8UZ6PC+hJLronGNq+qjdSAUhr4CfJCC7kzyHdVvXREFR27N/E\nYAbrA1SGHIL3sAz551GTCEkcaqHInk2VxCu9uz6XC4MY2xUQ9QSfdE9Hht4IvrUL\nDmRyeTMVRfDyJgsLljnCNKN/iWUh2DuTE1QrCkgHqDGHsVibEc4r0H0Q6t7lT8yo\n+AVD1dp4DAoMXqnMS3aN5bz2GgnJ3gixMC+FxJ387x8TSSt4t7/poDmlT57ZaoxS\nRu3J69wiW6uA7Gi+qJ5wjcYiZVDZuFjxsR8ZQtnHuQKBgQD98R7KeOw36r+pqIBb\nnJsmzu/K/DdgiF0LHZSufqtFqzoEP0eNr8mcuOl3NEEXpohYGC+gDdaRIzYfRYCN\nMlCOUL2HhK+dTQurtHiL/Ky9JsFEIlaHfWWJcAJqjM9gnXDA3th5u7LhkjsnHFR9\n+WZPqrpKqUKwmE6GrK/pZvOtKQKBgQDhz9Q+P5T121Ro2tEN20f6OINbUAU4Fq+J\n1uVEyEKnhgQwYJX7FmJxwRwOrzbfe3hjTPiaOP/rA99NI751Bh7o3liXjEeSk4QH\nBEVf9YVWWbA0Vb9bXvcMyv4Ly7RQ4QcnuRF9ulTUAbmR+uwWeX3qkTpB6SZ6ByHN\nPOFoWLI0+QKBgC7ZnF+ofZQ3aBLp9nxwYSOAzDa734+cuOXDGFo1Hm4lD/gWoKHg\nS6bxaolGh7fQTplKJQc3Zl2yjFqqnPPv03LeLIljDm9L9ppAGnlhLZFcJA3o8+Pd\nW61Gj/uObPgbM+Exe+jBm1gIfYdSr7fqGlkaW3JI1ff0sZAhLfc2ukA5AoGBAKgA\njyFM/s+4QeHNQxIzHicNGrW6IFftkOZVqrf04ppuu/keMxffPJjzmqNWOtYkr5n5\nr1BWrhi1BdMHj/DS//YzTuhZpvpnpCfwRokxSuXGzrDxRvB9BANRl5dBFEPEWCV2\nrIvFMM2XBvCUJkhGVadKK3TUORs66SwganfO3a9JAoGBAPlSBOE/oqmHmV9DfpJh\nsRSPg77UijvLe3BtGTGbIVhBHX5dP0H/r8uMAZL2hAG+XS5InQVX5j9CAXHTKsAI\nwm9/bwlI/h+6l2GHfqCxR8lWRgRUA+iiJ6YGJK/7HSSxgRUrtChChrewGPYrMJgv\nppSF2DqB771d1P/r0lozgcQ+\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=permit-tracker-8f6bb.firebasestorage.app
```

**⚠️ Important pour FIREBASE_PRIVATE_KEY:**
- Gardez les guillemets
- Gardez tous les `\n` (caractères de nouvelle ligne)

## 🔧 Configuration Vercel

Le fichier `vercel.json` est déjà configuré avec :
- Build command
- Install command (inclut Playwright)
- Framework détecté automatiquement

## 📦 Build Settings (Automatiques)

Vercel détecte automatiquement :
- **Framework:** Next.js
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install && npx playwright install chromium`

## ✅ Vérification Post-Déploiement

Après le déploiement, vérifiez :

1. **Application accessible** : Ouvrez l'URL fournie par Vercel
2. **Upload de fichier** : Testez avec un fichier Excel
3. **Traitement** : Vérifiez qu'un job se crée
4. **Firebase** : Vérifiez Firestore pour les documents de job
5. **Téléchargement** : Testez le téléchargement des résultats

## 🔍 Logs et Monitoring

- **Logs en temps réel** : `vercel logs`
- **Dashboard** : https://vercel.com/dashboard
- **Analytics** : Disponible dans le dashboard

## 🚨 Dépannage

### Erreur: "Environment variables missing"
→ Ajoutez toutes les variables dans Vercel Dashboard

### Erreur: "Playwright not found"
→ Vercel installe automatiquement, mais vérifiez les logs de build

### Erreur: "Firebase connection failed"
→ Vérifiez que toutes les variables Firebase sont correctes

### Build échoue
→ Vérifiez les logs : `vercel logs [deployment-url]`

## 🎉 C'est Tout !

Vercel gère tout automatiquement :
- ✅ Build
- ✅ Déploiement
- ✅ Routes API
- ✅ CDN
- ✅ SSL
- ✅ Scaling

## 📝 Commandes Utiles

```bash
# Déployer en production
vercel --prod

# Déployer en preview
vercel

# Voir les logs
vercel logs

# Lister les déploiements
vercel ls

# Ouvrir le dashboard
vercel dashboard
```

---

**Prêt à déployer !** 🚀

