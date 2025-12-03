# 📦 Repository GitHub

## ✅ Repository Créé !

Votre projet a été publié sur GitHub :

**🔗 Repository URL:** https://github.com/ZachDevT/permit-tracker

## 🚀 Connecter Vercel à GitHub

Maintenant que votre code est sur GitHub, vous pouvez connecter Vercel directement :

### Option 1: Via Vercel Dashboard (Recommandé)

1. Allez sur : https://vercel.com/new
2. Cliquez sur **"Import Git Repository"**
3. Sélectionnez **GitHub**
4. Autorisez Vercel à accéder à vos repositories si demandé
5. Sélectionnez **`ZachDevT/permit-tracker`**
6. Cliquez sur **"Import"**

### Option 2: Via Vercel CLI

```bash
# Se connecter à Vercel
vercel login

# Lier le projet (il détectera automatiquement GitHub)
vercel link

# Déployer
vercel --prod
```

## ⚙️ Configuration Vercel

Vercel détectera automatiquement :
- ✅ Framework: Next.js
- ✅ Build Command: `npm run build`
- ✅ Install Command: `npm install && npx playwright install chromium`
- ✅ Output Directory: `.next`

## 📋 Variables d'Environnement

**Important** : Après avoir importé le projet, ajoutez les variables d'environnement :

1. Dans Vercel Dashboard → Votre projet → **Settings** → **Environment Variables**
2. Ajoutez toutes les variables depuis `.env.local` :

### Client-side (NEXT_PUBLIC_*)
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

### Server-side
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY` (avec guillemets et `\n`)
- `FIREBASE_STORAGE_BUCKET`

## ✅ Avantages de GitHub + Vercel

- ✅ **Déploiement automatique** : Chaque push sur `main` déploie automatiquement
- ✅ **Preview deployments** : Chaque PR crée un preview
- ✅ **Rollback facile** : Retour à n'importe quel déploiement précédent
- ✅ **CI/CD intégré** : Build automatique à chaque changement

## 🔄 Workflow Recommandé

1. **Développement local** : `npm run dev`
2. **Commit et push** : `git push origin main`
3. **Déploiement automatique** : Vercel déploie automatiquement
4. **Variables d'env** : Configurées une fois dans Vercel Dashboard

## 📝 Commandes Git Utiles

```bash
# Voir le status
git status

# Ajouter des changements
git add .
git commit -m "Description des changements"
git push origin main

# Voir les commits
git log

# Voir le remote
git remote -v
```

## 🎉 C'est Tout !

Votre code est maintenant sur GitHub et prêt à être connecté à Vercel !

---

**Repository:** https://github.com/ZachDevT/permit-tracker
**Prêt pour Vercel:** ✅ Oui

