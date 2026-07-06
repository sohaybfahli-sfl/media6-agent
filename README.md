# 🚀 Media6 Workflow Agent

**Agent IA pour automatiser le workflow Media6**  
Résumés email + WeChat, synchronisation calendrier Outlook, couplage des données par projet.

---

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [Prérequis](#prérequis)
4. [Installation](#installation)
5. [Configuration](#configuration)
6. [Déploiement](#déploiement)
7. [Utilisation](#utilisation)
8. [FAQ](#faq)

---

## 🎯 Vue d'ensemble

### Qu'est-ce que cet agent fait ?

L'agent **lit automatiquement**:
- 📧 Tes emails Outlook
- 💬 Tes messages WeChat

Il **traite les données** :
- 🔗 Couple par numéro de projet (4 chiffres)
- ⏭️ Évite les doublons
- 🎯 Calcule les priorités (URGENT / HIGH / NORMAL)
- 📅 Extrait les deadlines

Il **envoie les résumés** :
- 📬 Email Outlook (21h30 + 07h30)
- 📌 Ajoute au calendrier Outlook
- 🔔 Notifie des photos à vérifier

### Résumé des fichiers

| Fichier | Rôle |
|---------|------|
| `config.js` | Configuration (projets, règles, horaires) |
| `reader.js` | Lit les emails Outlook |
| `wechat.js` | Traite les messages WeChat |
| `processor.js` | Couple Email + WeChat, évite doublons |
| `sender.js` | Envoie résumés + calendrier |
| `main.js` | Orchestre tout + scheduling |
| `package.json` | Dépendances npm |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│         SOURCES DE DONNÉES              │
│  Outlook (emails)  │  WeChat (messages) │
└──────────┬──────────────┬───────────────┘
           │              │
           └──────┬───────┘
                  │
         ┌────────▼────────┐
         │  EmailReader +  │
         │  WeChatProcessor│
         │  (filtrage)     │
         └────────┬────────┘
                  │
         ┌────────▼────────┐
         │  DataProcessor  │
         │  • Couplage par │
         │    projet       │
         │  • Anti-doublon │
         │  • Priorités    │
         │  • Deadlines    │
         └────────┬────────┘
                  │
         ┌────────▼────────┐
         │  SummarySender  │
         │  • Email HTML   │
         │  • Calendrier   │
         │  • Notifications│
         └────────┬────────┘
                  │
         ┌────────▼────────┐
         │   TOI ! 🎉      │
         │  Résumés clairs │
         └─────────────────┘
```

---

## ✅ Prérequis

### Avant de déployer:

1. **M365 MCP Client connecté**
   - ✅ M365 MCP Client for Claude approuvé par admin
   - ✅ Accès à Outlook + Calendrier
   - ✅ OneDrive disponible (pour Phase 2)

2. **Node.js**
   - Version 18+ installée
   - npm 9+

3. **Compte Railway** (ou autre cloud)
   - Compte créé et connecté

4. **Informations locales**
   - Fuseau horaire suisse (UTC+1 ou UTC+2)
   - Projets Excel importés dans config.js

---

## 🔧 Installation

### Étape 1 : Cloner/Créer le projet

```bash
# Crée un nouveau dossier
mkdir media6-workflow-agent
cd media6-workflow-agent

# Copie les 7 fichiers ici :
# - config.js
# - reader.js
# - wechat.js
# - processor.js
# - sender.js
# - main.js
# - package.json
```

### Étape 2 : Installer les dépendances

```bash
npm install
```

Cela installe:
- `express` - serveur web (pour webhook WeChat)
- `axios` - requêtes HTTP
- `xlsx` - lecture Excel (Phase 2)
- `dotenv` - variables d'environnement
- `node-schedule` - scheduling des tâches

### Étape 3 : Tester localement

```bash
npm start
```

Tu devrais voir:
```
==================================================
🚀 INITIALISATION DE L'AGENT WORKFLOW MEDIA6
==================================================

🚀 PREMIÈRE EXÉCUTION DÉTECTÉE - Mode BACKFILL activé

📖 Configuré pour lire l'HISTORIQUE COMPLET

⚙️  EXÉCUTION PIPELINE - SOIR (21h30)
==================================================
...
✅ BACKFILL COMPLÉTÉ

📅 Configuration des résumés programmés...

  ✅ SOIR : 21:30 Swiss time
     Prochaine exécution: [date/heure]
     
  ✅ MATIN : 07:30 Swiss time
     Prochaine exécution: [date/heure]
```

---

## ⚙️ Configuration

### Modifier les heures des résumés

Dans `config.js`:

```javascript
const SCHEDULE = {
  EVENING_SUMMARY: '21:30',  // Change ici
  MORNING_REFRESH: '07:30',  // Change ici
};
```

### Modifier les règles de priorité

Dans `config.js`:

```javascript
const PRIORITY_RULES = {
  URGENT: {
    keywords: ['URGENT', 'ASAP', 'TODAY'],  // Ajoute des mots-clés
    senders: ['sandra.bastiat@media6.com'],  // Ajoute des emails
    projects: ['3231'],  // Ajoute des projets
  },
  // ...
};
```

### Ajouter/Modifier des projets

Dans `config.js`:

```javascript
const PROJECTS = [
  { projectNo: '3200', customer: 'CHOPARD', description: 'Popup store', pm: 'Tom', status: 'On going' },
  // Ajoute tes projets ici
];
```

---

## 🚀 Déploiement sur Railway

### Étape 1 : Pousser le code sur GitHub

```bash
git init
git add .
git commit -m "Initial commit: Media6 Workflow Agent"
git remote add origin https://github.com/[TON_USERNAME]/media6-workflow-agent.git
git push -u origin main
```

### Étape 2 : Créer un projet Railway

1. Va sur https://railway.app
2. Clique "New Project"
3. "Deploy from GitHub"
4. Sélectionne ton repo `media6-workflow-agent`
5. Railway détecte automatiquement Node.js

### Étape 3 : Ajouter les variables d'environnement

Dans Railway, va à "Variables":

```
PORT=3000
RAILWAY_PUBLIC_DOMAIN=ton-app.railway.app
WEBHOOK_SECRET=un-secret-long-et-complexe-que-tu-inventes
```

### Étape 4 : Déployer

Railway déploie automatiquement à chaque `git push`.

Le log doit afficher:
```
✅ BACKFILL COMPLÉTÉ
✅ AGENT DÉMARRÉ ET EN ATTENTE
```

---

## 📖 Utilisation

### Qu'est-ce qui se passe automatiquement

**Chaque jour à 21h30 (soir)** :
- Lit les 24 dernières heures d'emails
- Lit les 12 dernières heures de WeChat (capture 19h-7h Swiss)
- Couple par projet
- Envoie résumé email
- Ajoute deadlines au calendrier

**Chaque jour à 07h30 (matin)** :
- Idem, mais capture les messages de la nuit (3h-15h China = 20h-7h Swiss)
- Résumé "rafraîchi" avec infos overnight

### Premier déploiement (BACKFILL)

Au déploiement initial:
- Lit **l'HISTORIQUE COMPLET** (100 emails + 30 groupes WeChat)
- Traite et stocke
- À partir du 2e résumé : revient à 24h lookback

Temps estimé : **2-5 minutes**

### Après déploiement

- L'agent tourne en arrière-plan sur Railway
- Envoie les résumés automatiquement
- Crée les événements calendrier
- Signale les photos à vérifier

---

## ❓ FAQ

### Q: Où sont stockés les message IDs (anti-doublon) ?

R: Dans `/tmp/processed_messages.json` sur Railway.

Si tu veux réinitialiser (attention : va relire tout):
```bash
railway run npm run clean
```

### Q: Pourquoi 24h lookback et pas 12h ?

R: Parce que tu reçois pas de mails la nuit (pas comme China). 24h capture toute la journée complète.

### Q: Que se passe-t-il si le webhook WeChat n'est pas configuré ?

R: Phase 1 utilise des **messages de test**. En Phase 2, quand tu configures le webhook, on passe aux vrais messages en temps réel.

### Q: L'agent peut-il traiter les images WeChat ?

R: Non (Phase 1). Il les **détecte** et les signale ("📸 3 photos à vérifier"). 
Phase 2 : On peut les télécharger automatiquement sur le Drive Media6.

### Q: Comment ajouter OneDrive (Phase 2) ?

R: Une fois que tu dis "oui", je crée :
- `onedrive.js` - Lit l'Excel depuis Drive
- Met à jour `config.js` pour charger depuis Drive au lieu du code

Ça prend 30 min max.

---

## 📞 Support

**Si quelque chose ne marche pas** :

1. Vérifie le log Railway : `railway logs`
2. Vérifie que M365 MCP est bien connecté
3. Vérifie les heures dans `config.js` (fuseau horaire suisse)
4. Relance : `railway run npm start`

---

## 🎉 Prochaines étapes

**Phase 2 (semaine prochaine)** :
- ✅ OneDrive integration (lire Excel depuis Drive)
- ✅ Interface de chat (poser des questions à l'agent)
- ✅ Webhook WeChat officiel
- ✅ Database (ne plus utiliser JSON)

**Phase 3 (futur)** :
- Analyse des images WeChat (OCR)
- Génération automatique de rapports
- Intégration Slack
- Export vers SharePoint

---

## 📝 Notes importantes

1. **Backfill = Une seule fois**
   - À la 1ère exécution, lit tout
   - Après : mode 24h normal

2. **Anti-doublons = Critique**
   - Pas de répétitions même si tu redémarres
   - Les IDs sont sauvegardés

3. **Couplage Email + WeChat = La magie**
   - Même projet = 1 seul item
   - Contexte des 2 sources
   - Facilite le triage

4. **Priorités = Basées sur les règles**
   - Modifie les règles dans `config.js` si besoin
   - L'agent apprend de l'usage (après Phase 2)

---

**Créé avec ❤️ pour Media6 Masterpiece**  
Agent Workflow v1.0 - Juillet 2026
