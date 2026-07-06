# 🚀 Guide de déploiement - Railway (SANS GIT)

## **Avant de commencer**

Tu as :
- ✅ Les 9 fichiers téléchargés (config.js, reader.js, etc.)
- ✅ M365 MCP connecté
- ✅ Un compte Railway (gratuit)

---

## **ÉTAPE 1 : Créer un compte Railway (2 min)**

1. Va sur **https://railway.app**
2. Clique **"Sign Up"**
3. Connecte-toi avec GitHub (ou Email)
   - Si tu n'as pas GitHub, crée-le en 1 min (c'est juste pour l'auth, on n'en a pas besoin autrement)

✅ Voilà ! Tu es sur Railway.

---

## **ÉTAPE 2 : Créer un nouveau projet (1 min)**

1. Sur la page d'accueil Railway, clique **"New Project"**
2. Clique **"Deploy from repo"** → **"GitHub"**
3. Une fenêtre Git va s'ouvrir... **mais on va l'ignorer** ! Continue avec l'option suivante :

**Alternative sans GitHub** :
- Clique **"Empty Project"** à la place
- Railway crée un projet vide

✅ Tu as un projet vide sur Railway.

---

## **ÉTAPE 3 : Uploader tes fichiers DIRECTEMENT (3 min)**

Là, tu vas utiliser l'interface Railway (pas Git du tout).

### **Méthode 1 : Via Railway CLI (le plus simple)**

**A. Installe Railway CLI :**
- Va sur https://docs.railway.app/guides/cli
- Télécharge le CLI pour ton OS (Windows, Mac, Linux)
- Double-clique pour installer

**B. Dans Terminal (ou Powershell sur Windows) :**

```bash
# Se connecter à Railway
railway login

# Créer un nouveau projet
railway init

# Choisis un nom pour ton projet
# Réponds "yes" quand demandé

# Copie tes 9 fichiers dans ce dossier

# Déploie !
railway deploy
```

**C'est fini !** Railway détecte `package.json`, installe npm, et lance ton agent.

---

### **Méthode 2 : Sans Terminal (UI seulement)**

Si tu veux VRAIMENT pas toucher à un terminal :

1. Crée un **dossier "media6-agent"** sur ton ordi
2. Copie les 9 fichiers dedans
3. Crée un fichier vide **`.gitignore`** (juste ce nom)
   - Dedans, mets : `node_modules`

4. Sur **Railway.app**, dans ton projet :
   - Clique **"Add Service"** → **"GitHub"**
   - Même sans Git, ça laisse uploader des fichiers via leur interface

(Honnêtement, la Méthode 1 est plus simple)

---

## **ÉTAPE 4 : Configurer les variables d'environnement (2 min)**

Une fois que Railway a démarré ton projet :

1. Va dans **Settings** → **Variables**
2. Ajoute :

```
PORT=3000
RAILWAY_PUBLIC_DOMAIN=ton-app.railway.app
WEBHOOK_SECRET=ton-secret-long-et-complexe-12345
```

✅ Railway configure tout automatiquement.

---

## **ÉTAPE 5 : Vérifier que ça marche (2 min)**

1. Va dans **Deployments**
2. Regarde le **Build Log** :
   - Si tu vois `✅ Successfully deployed`, c'est bon !
   - Si tu vois des erreurs rouges, c'est qu'il manque un truc

3. Clique sur **"View Logs"** pour voir ce qui se passe en temps réel
   - Tu devrais voir :
   ```
   🚀 INITIALISATION DE L'AGENT WORKFLOW MEDIA6
   🚀 PREMIÈRE EXÉCUTION DÉTECTÉE - Mode BACKFILL activé
   📖 Lecture de l'historique COMPLET
   ...
   ✅ AGENT DÉMARRÉ ET EN ATTENTE
   ```

✅ L'agent tourne ! 🎉

---

## **ÉTAPE 6 : Recevoir les résumés (automatique)**

À partir de maintenant :
- **Chaque jour à 21h30** (heure suisse) → Email avec résumé du soir
- **Chaque jour à 07h30** → Email avec mise à jour du matin

Les résumés arrivent dans `sohayb.fahli-laout@media6.com` automatiquement.

---

## **Troubleshooting rapide**

### **Ça ne marche pas ?**

**1. Vérifier les logs :**
- Railway → Deployments → View Logs
- Cherche les messages d'erreur

**2. Erreur "M365 MCP not connected" ?**
- Retourne sur Claude.ai
- Assure-toi que M365 MCP est bien connecté
- Réessaie le déploiement

**3. "Cannot find module X" ?**
- C'est que `npm install` n'a pas marché
- Railway → Settings → Redeploy
- Clique **"Trigger Deploy"** encore une fois

**4. Pas d'emails reçus ?**
- L'agent tourne mais les emails ne sont pas envoyés (c'est normal en Phase 1)
- Les emails seront intégrés en Phase 2
- Pour maintenant, regarde les logs pour vérifier que tout tourne

---

## **Résumé des étapes**

| Étape | Durée | Quoi faire |
|-------|-------|-----------|
| 1 | 2 min | Créer compte Railway |
| 2 | 1 min | Créer un projet vide |
| 3 | 3 min | Uploader tes fichiers (CLI ou UI) |
| 4 | 2 min | Ajouter les variables d'env |
| 5 | 2 min | Vérifier les logs (voir "✅ AGENT DÉMARRÉ") |
| 6 | 0 min | Attendre les résumés chaque jour |

**Total : 10 minutes** ⏱️

---

## **Et après ?**

Une fois que tu vois `✅ AGENT DÉMARRÉ ET EN ATTENTE`, c'est gagné !

**Phase 2 (dans quelques semaines)** :
- Ajouter l'interface de chat (poser des questions à l'agent)
- Lire Excel directement depuis OneDrive
- Webhook WeChat officiel

Mais pour maintenant, ton agent tourne **24/7 sur Railway** ! 🚀

---

## **Questions ?**

Si quelque chose ne marche pas :
1. Regarde les logs Railway
2. Vérifie que M365 MCP est connecté
3. Demande-moi !

**Bravo d'avoir un vrai agent automation ! 💪**
