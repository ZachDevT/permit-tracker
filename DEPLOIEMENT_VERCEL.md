# 🚀 Déploiement sur Vercel - Guide Simple

## ✅ Tout est Prêt !

Votre application est configurée et prête à être déployée sur Vercel.

## 🎯 Déploiement en 3 Étapes

### 1️⃣ Se connecter à Vercel

```bash
vercel login
```

Cela ouvrira votre navigateur pour vous connecter avec votre compte GitHub, GitLab, ou Bitbucket.

### 2️⃣ Déployer

```bash
vercel --prod
```

Ou utilisez le script automatique :

```bash
./deploy.sh
```

### 3️⃣ Ajouter les Variables d'Environnement

**Important** : Après le premier déploiement, vous devez ajouter les variables d'environnement.

1. Allez sur : https://vercel.com/dashboard
2. Cliquez sur votre projet **permit-tracker**
3. Allez dans **Settings** → **Environment Variables**
4. Ajoutez toutes les variables depuis `.env.local`

#### Variables à Ajouter :

**Client-side (NEXT_PUBLIC_*) :**
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

**Server-side :**
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY` (⚠️ gardez les guillemets et les `\n`)
- `FIREBASE_STORAGE_BUCKET`

5. **Redéployez** après avoir ajouté les variables :
   ```bash
   vercel --prod
   ```

## ✅ Vérification

Après le déploiement :

1. ✅ Ouvrez l'URL fournie par Vercel
2. ✅ Testez l'upload d'un fichier Excel
3. ✅ Vérifiez que le traitement fonctionne
4. ✅ Testez le téléchargement des résultats

## 🔍 Commandes Utiles

```bash
# Déployer en production
vercel --prod

# Voir les logs
vercel logs

# Ouvrir le dashboard
vercel dashboard

# Lister les déploiements
vercel ls
```

## 🎉 C'est Tout !

Vercel gère automatiquement :
- ✅ Build de l'application
- ✅ Déploiement
- ✅ Routes API
- ✅ CDN global
- ✅ SSL/HTTPS
- ✅ Scaling automatique

## 📖 Documentation Complète

Voir `VERCEL_DEPLOY.md` pour plus de détails.

---

**Prêt à déployer !** 🚀

