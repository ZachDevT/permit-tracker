# 🔧 Fix 404 Error on Vercel

## Problèmes Possibles et Solutions

### 1. ✅ Vérifier les Logs de Build

Dans Vercel Dashboard :
1. Allez sur votre projet
2. Cliquez sur **"Deployments"**
3. Ouvrez le dernier déploiement
4. Vérifiez les **"Build Logs"**

**Si le build échoue :**
- Vérifiez que toutes les dépendances sont dans `package.json`
- Vérifiez que Playwright s'installe correctement

### 2. ✅ Vérifier les Variables d'Environnement

**Important** : Les variables doivent être ajoutées pour **Production**, **Preview**, et **Development**.

Dans Vercel Dashboard :
1. **Settings** → **Environment Variables**
2. Vérifiez que toutes les variables sont présentes
3. Vérifiez qu'elles sont activées pour **Production**

### 3. ✅ Vérifier la Configuration Vercel

Le fichier `vercel.json` doit être correct. Vérifiez qu'il contient :

```json
{
  "buildCommand": "npm run build",
  "installCommand": "npm install && npx playwright install chromium",
  "framework": "nextjs"
}
```

### 4. ✅ Redéployer

Après avoir corrigé les problèmes :

1. Dans Vercel Dashboard → **Deployments**
2. Cliquez sur les **3 points** du dernier déploiement
3. Sélectionnez **"Redeploy"**

Ou via CLI :
```bash
vercel --prod
```

### 5. ✅ Vérifier le Build Local

Testez que le build fonctionne localement :

```bash
npm run build
npm start
```

Si ça fonctionne localement mais pas sur Vercel, c'est probablement un problème de variables d'environnement.

### 6. ✅ Vérifier Firebase Admin

L'erreur peut venir de Firebase Admin qui ne s'initialise pas correctement.

Vérifiez dans les logs Vercel si vous voyez :
- "Firebase Admin credentials are missing"
- "Service account object must contain..."

**Solution** : Vérifiez que `FIREBASE_PRIVATE_KEY` contient bien les `\n` et est entre guillemets.

### 7. ✅ Vérifier la Structure des Fichiers

Assurez-vous que :
- `app/page.tsx` existe
- `app/layout.tsx` existe
- `next.config.js` existe

### 8. ✅ Solution Rapide : Forcer un Nouveau Déploiement

```bash
# Commit un petit changement
git commit --allow-empty -m "Trigger redeploy"
git push origin main
```

Cela déclenchera un nouveau déploiement automatique.

## 🔍 Checklist de Dépannage

- [ ] Build réussit localement (`npm run build`)
- [ ] Toutes les variables d'environnement sont dans Vercel
- [ ] Variables activées pour **Production**
- [ ] `FIREBASE_PRIVATE_KEY` a les guillemets et `\n`
- [ ] Logs de build Vercel ne montrent pas d'erreurs
- [ ] Structure des fichiers correcte
- [ ] Redéploiement effectué

## 📞 Si le Problème Persiste

1. **Vérifiez les logs détaillés** dans Vercel Dashboard
2. **Testez localement** avec les mêmes variables d'environnement
3. **Vérifiez** que le repository GitHub est correctement connecté

---

**Note** : L'erreur 404 sur Vercel est souvent due à :
- Variables d'environnement manquantes (80% des cas)
- Build qui échoue silencieusement (15% des cas)
- Configuration incorrecte (5% des cas)

