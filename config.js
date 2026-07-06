// ============================================
// CONFIG.JS - Configuration de l'agent
// ============================================
// Ce fichier contient :
// 1. Les données des projets (depuis ton CSV)
// 2. Les règles de priorité
// 3. Les paramètres de l'agent

// ============================================
// PARTIE 1 : DONNÉES DES PROJETS
// ============================================
// Format : 
// - Project No : le numéro 4-chiffres (clé d'union Email/WeChat)
// - Customer : la marque (CHOPARD, LV, etc.)
// - Description : nom du projet
// - PM : responsable projet
// - Status : On going, Closed, Lost, Standby

const PROJECTS = [
  // Format: { projectNo, customer, description, pm, status }
  { projectNo: '2944', customer: 'AP', description: 'FULLDIAMONDS', pm: 'Rambo', status: 'On going' },
  { projectNo: '2651', customer: 'CHOPARD', description: 'FLOWERS', pm: 'TOM', status: 'On going' },
  { projectNo: '2600', customer: 'CHOPARD', description: 'Harrot Frame', pm: 'Sandra', status: 'Closed' },
  { projectNo: '2683', customer: 'CHOPARD', description: 'RAMADAN 2023', pm: 'TOM', status: 'On going' },
  { projectNo: '2719', customer: 'CHOPARD', description: 'KING CROWN', pm: 'Rambo', status: 'On going' },
  { projectNo: '2723', customer: 'LOUIS VUITTON', description: 'XMAS 2023 LV', pm: 'Franck', status: 'On going' },
  { projectNo: '2731', customer: 'CHOPARD', description: '1000 MIGLIA', pm: 'RAMBO', status: 'On going' },
  { projectNo: '2732', customer: 'OMEGA', description: 'AQUA TERRA', pm: 'TOM', status: 'On going' },
  { projectNo: '2736', customer: 'CHOPARD', description: 'AUTUMN', pm: 'Rambo', status: 'On going' },
  { projectNo: '2737', customer: 'OMEGA SWITZERLAND', description: 'OMEGA SA LOGO', pm: 'TOM', status: 'On going' },
  { projectNo: '2738', customer: 'VACHERON CONSTANTIN', description: 'BU25 WAVE', pm: 'Franck', status: 'On going' },
  { projectNo: '2739', customer: 'FENDI', description: 'VOB PORTAL', pm: 'Franck', status: 'On going' },
  { projectNo: '2740', customer: 'JAEGER LECOULTRE', description: 'CVD K11 JLC', pm: 'Franck', status: 'On going' },
  { projectNo: '2747', customer: 'CHOPARD', description: 'MUCHARABI SKP', pm: 'Rambo', status: 'On going' },
  { projectNo: '2751', customer: 'LOUIS VUITTON', description: 'LV_RE ORDER 2024 NAMIKI', pm: 'TOM', status: 'On going' },
  { projectNo: '2760', customer: 'CHOPARD', description: 'CNY 2024', pm: 'RAMBO', status: 'On going' },
  { projectNo: '2762', customer: 'CHOPARD', description: 'SAINT VALENTIN 2023', pm: 'Sandra', status: 'Closed' },
  { projectNo: '2772', customer: 'JAEGER LECOULTRE', description: 'PRECISION 2024', pm: 'RAMBO', status: 'Closed' },
  { projectNo: '2784', customer: 'CHOPARD', description: 'ICE CUBE', pm: 'Rambo', status: 'On going' },
  { projectNo: '2786', customer: 'CHOPARD', description: 'DESPONT', pm: 'Sandra', status: 'Closed' },
  { projectNo: '2806', customer: 'LOUIS VUITTON', description: 'PLINTHES', pm: 'JACK', status: 'On going' },
  { projectNo: '2810', customer: 'JAEGER LECOULTRE', description: 'HOLIDAY SEASON 2024', pm: 'Rambo/Francois', status: 'Closed' },
  { projectNo: '2811', customer: 'VACHERON CONSTANTIN', description: 'BU25 W2 PITCH', pm: 'Francois', status: 'On going' },
  { projectNo: '2815', customer: 'LOUIS VUITTON', description: 'MOON', pm: 'Rambo', status: 'On going' },
  { projectNo: '2822', customer: 'TIFFANY', description: 'JEWELRY TRUNK', pm: 'Franck', status: 'On going' },
  { projectNo: '2826', customer: 'LOUIS VUITTON', description: 'DUCK PILOT STORE', pm: 'JACK', status: 'On going' },
  { projectNo: '2827', customer: 'MH DECORS', description: 'OMEGA Logo', pm: 'TOM', status: 'On going' },
  { projectNo: '2830', customer: 'LOUIS VUITTON', description: 'LV AILLETTE GL', pm: 'TOM', status: 'Closed' },
  { projectNo: '2833', customer: 'CHOPARD', description: 'CORAL', pm: 'Tom', status: 'On going' },
  { projectNo: '2834', customer: 'CHOPARD', description: 'FLORAL', pm: 'Rambo', status: 'On going' },
  { projectNo: '2836', customer: 'CHOPARD', description: 'GUILLOCHAGE', pm: 'Rambo', status: 'Closed' },
  { projectNo: '2844', customer: 'TUDOR', description: 'Special modules', pm: 'Rambo', status: 'Closed' },
  { projectNo: '2845', customer: 'CHOPARD', description: 'XMAS 2024', pm: 'Rambo', status: 'Lost' },
  { projectNo: '2847', customer: 'CARTIER', description: 'LANDSCAPES 2024', pm: 'Rambo', status: 'Lost' },
  { projectNo: '2850', customer: 'REMY', description: 'REMY COINTREAU', pm: 'Franck', status: 'Lost' },
  { projectNo: '3231', customer: 'CHAUMET', description: 'AO JOSEPHINE', pm: 'Sandra', status: 'On going' },
  // Ajoute les autres projets au besoin
];

// ============================================
// PARTIE 2 : CONFIGURATION DES HEURES
// ============================================
// L'agent tourne à ces heures (heure Swiss, 24h format)

const SCHEDULE = {
  EVENING_SUMMARY: '21:30',  // 21h30 - Résumé complet de la journée
  MORNING_REFRESH: '07:30',  // 07h30 - Rafraîchir avec les messages de la nuit (China 3h-15h)
};

// ============================================
// PARTIE 3 : PRIORITÉ DES EMAILS OUTLOOK
// ============================================
// Règles pour décider si un email est URGENT / IMPORTANT / NORMAL

const PRIORITY_RULES = {
  URGENT: {
    // 🔴 URGENT si l'une de ces conditions est vraie :
    keywords: ['URGENT', 'ASAP', 'TODAY'],  // Mots-clés dans objet/corps
    senders: ['sandra.bastiat@media6.com'],  // Sandra = toujours prioritaire
    projects: ['3231'],  // Projet 3231 (CHAUMET) = toujours prioritaire
  },
  HIGH: {
    // 🟡 IMPORTANT si :
    senders: ['sandra.bastiat@media6.com'],  // Emails de Sandra
    projects: ['3231'],  // Projet 3231
    deadlineDays: 7,  // Deadline dans moins de 7 jours
  },
  NORMAL: {
    // 🟢 NORMAL = tout le reste
  },
};

// ============================================
// PARTIE 4 : CONFIGURATION WECHAT
// ============================================
// Paramètres pour traiter les messages WeChat

const WECHAT_CONFIG = {
  // Extraire les messages des 12 dernières heures
  // (capture les messages China 3h-15h heure suisse)
  MESSAGE_LOOKBACK_HOURS: 12,
  
  // Noms alternatifs de Sohayb (mentions importantes)
  USER_MENTIONS: ['@Sohayb', '@Soso'],
  
  // Convention de noms de groupes WeChat
  // Format : [PROJECT_NUMBER]_[CUSTOMER]_[PROJECT_NAME]
  // Ex: 3200_CHOPARD_HAPPY_DIAMOND
  GROUP_NAME_PATTERN: /^(\d{4})_/,  // Regex pour extraire le numéro (4 chiffres au début)
  
  // Si "BF" dans le nom du groupe = producer est présent
  PRODUCER_FLAG: 'BF',
};

// ============================================
// PARTIE 5 : CONFIGURATION OUTLOOK/EMAIL
// ============================================
// Paramètres pour lire les emails

const OUTLOOK_CONFIG = {
  // Dossier à surveiller
  FOLDER: 'Inbox',
  
  // Extraire les emails des dernières X heures
  // (on relit tout à chaque résumé pour pas rater des mises à jour)
  LOOKBACK_HOURS: 24,
  
  // Email de réception des résumés
  RECIPIENT_EMAIL: 'sohayb.fahli-laout@media6.com',
  
  // Adresse d'envoi (généralement ton email)
  SENDER_EMAIL: 'sohayb.fahli-laout@media6.com',
};

// ============================================
// PARTIE 6 : CONFIGURATION CALENDRIER OUTLOOK
// ============================================
// Pour créer automatiquement les événements

const CALENDAR_CONFIG = {
  // Créer les événements dans ce calendrier
  CALENDAR_NAME: 'Calendar',  // Le calendrier par défaut de Outlook
  
  // Couleur des événements (si possible)
  EVENT_COLOR: 'blue',
};

// ============================================
// PARTIE 7 : CONFIGURATION RAILWAY (RUNTIME)
// ============================================
// Ces paramètres changent en fonction de l'environnement

const RUNTIME_CONFIG = {
  // Port du serveur (pour le webhook WeChat)
  PORT: process.env.PORT || 3000,
  
  // URL publique du serveur (pour webhook WeChat)
  // Sur Railway : https://ton-app.railway.app
  PUBLIC_URL: process.env.RAILWAY_PUBLIC_DOMAIN ? 
    `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : 
    'http://localhost:3000',
  
  // Token/secret pour sécuriser le webhook (génère un code aléatoire)
  WEBHOOK_SECRET: process.env.WEBHOOK_SECRET || 'dev-secret-change-this',
  
  // Chemin du fichier JSON qui stocke les IDs traités (anti-doublons)
  PROCESSED_MESSAGES_FILE: '/tmp/processed_messages.json',
};

// ============================================
// PARTIE 8 : FONCTION UTILITAIRE
// ============================================
// Trouve les infos d'un projet par son numéro

function getProjectInfo(projectNo) {
  const project = PROJECTS.find(p => p.projectNo === projectNo);
  return project || {
    projectNo,
    customer: 'UNKNOWN',
    description: 'Unknown Project',
    pm: 'Unknown',
    status: 'Unknown'
  };
}

// ============================================
// EXPORT
// ============================================
// Exporte tout pour que les autres fichiers puissent l'utiliser

module.exports = {
  PROJECTS,
  SCHEDULE,
  PRIORITY_RULES,
  WECHAT_CONFIG,
  OUTLOOK_CONFIG,
  CALENDAR_CONFIG,
  RUNTIME_CONFIG,
  getProjectInfo,
};
