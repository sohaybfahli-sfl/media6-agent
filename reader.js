// ============================================
// READER.JS - Lecture des emails Outlook
// ============================================
// Ce fichier :
// 1. Lit les emails depuis Outlook
// 2. Extrait le numéro de projet (4 chiffres)
// 3. Décide de la priorité
// 4. Extrait les dates/deadlines
// 5. Retourne une liste formatée

const config = require('./config');

// ============================================
// CLASSE : EmailReader
// ============================================
// Cette classe s'occupe de tout ce qui concerne Outlook

class EmailReader {
  constructor() {
    // Tu vas connecter M365 MCP ici plus tard
    // Pour maintenant, on va simuler avec des données de test
    this.emails = [];
  }

  // ============================================
  // MÉTHODE 1 : Lire les emails LIVE depuis Outlook
  // ============================================
  // Utilise M365 MCP Client pour accéder à Outlook en temps réel
  
  async fetchEmails() {
    try {
      console.log('📧 Lecture des emails Outlook via M365 MCP...');
      
      // En Phase 1 avec M365 MCP connecté : lire LIVE depuis Outlook
      // Le lookback est configuré dans config.js
      
      const lookbackHours = config.OUTLOOK_CONFIG.LOOKBACK_HOURS;
      
      // Construit le filtre de date
      let afterDateTime;
      if (lookbackHours === null) {
        // BACKFILL : lire toute la boîte (pas de filtre de date)
        console.log('  📖 Mode BACKFILL : lecture de l\'historique COMPLET');
        afterDateTime = null;
      } else {
        // MODE NORMAL : 24 dernières heures
        const now = new Date();
        const past = new Date(now.getTime() - lookbackHours * 60 * 60 * 1000);
        afterDateTime = past.toISOString();
        console.log(`  📖 Mode NORMAL : emails depuis ${afterDateTime}`);
      }
      
      // Appelle M365 MCP pour lire les emails
      // NOTE: En production, ce serait un vrai appel API à M365 MCP
      // Pour maintenant (Phase 1 test), on utilise les données de test
      // mais le structure est prête pour le vrai appel
      
      // FUTURE: Quand le Node.js runtime aura M365 MCP:
      // const emails = await m365Client.outlook_email_search({
      //   folderName: config.OUTLOOK_CONFIG.FOLDER,
      //   afterDateTime: afterDateTime,
      //   limit: 100,
      // });
      
      // En attendant, charge les données de test
      this.emails = this.getTestEmails();
      
      console.log(`✅ ${this.emails.length} emails trouvés`);
      return this.emails;
      
    } catch (error) {
      console.error('❌ Erreur lors de la lecture des emails:', error);
      return [];
    }
  }

  // ============================================
  // MÉTHODE 2 : Extraire le numéro de projet
  // ============================================
  // Cherche un numéro 4-chiffres dans l'objet du mail
  
  extractProjectNumber(emailSubject) {
    // Regex : cherche 4 chiffres n'importe où dans le texte
    // Exemple : "3200_CHOPARD_Popup" → extraire "3200"
    const match = emailSubject.match(/(\d{4})/);
    return match ? match[1] : null;
  }

  // ============================================
  // MÉTHODE 3 : Décider la priorité d'un email
  // ============================================
  // Applique les règles défines dans config.js
  
  decidePriority(email) {
    const subject = email.subject.toUpperCase();
    const body = email.body.toUpperCase();
    const sender = email.from.toLowerCase();
    const projectNo = this.extractProjectNumber(email.subject);

    // 🔴 URGENT ?
    // Condition 1 : Mots-clés URGENT/ASAP/TODAY
    for (const keyword of config.PRIORITY_RULES.URGENT.keywords) {
      if (subject.includes(keyword) || body.includes(keyword)) {
        return 'URGENT';
      }
    }

    // Condition 2 : Email de Sandra
    if (config.PRIORITY_RULES.URGENT.senders.some(s => sender.includes(s.toLowerCase()))) {
      return 'URGENT';
    }

    // Condition 3 : Projet 3231 (CHAUMET)
    if (projectNo && config.PRIORITY_RULES.URGENT.projects.includes(projectNo)) {
      return 'URGENT';
    }

    // 🟡 IMPORTANT ?
    // Condition 1 : Email de Sandra (fait partie de HIGH aussi)
    if (config.PRIORITY_RULES.HIGH.senders.some(s => sender.includes(s.toLowerCase()))) {
      return 'HIGH';
    }

    // Condition 2 : Projet 3231
    if (projectNo && config.PRIORITY_RULES.HIGH.projects.includes(projectNo)) {
      return 'HIGH';
    }

    // Condition 3 : Deadline dans moins de 7 jours
    // (on verra comment détecter les dates après)
    // if (this.hasUpcomingDeadline(email)) {
    //   return 'HIGH';
    // }

    // 🟢 NORMAL = tout le reste
    return 'NORMAL';
  }

  // ============================================
  // MÉTHODE 4 : Extraire les dates/deadlines
  // ============================================
  // Cherche les dates mentionnées dans le mail
  
  extractDeadlines(emailBody) {
    // Patterns de dates courantes :
    // - "31 Aug" / "31 August"
    // - "15 juillet"
    // - "Aug.3" / "3 Aug"
    // - "Mercredi 15 juillet"
    
    const deadlines = [];
    
    // Pattern 1 : "31 Aug" ou "31 August"
    const pattern1 = /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*/gi;
    const matches1 = emailBody.matchAll(pattern1);
    for (const match of matches1) {
      deadlines.push(match[0]);
    }

    // Pattern 2 : "15 juillet" (français)
    const pattern2 = /(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)/gi;
    const matches2 = emailBody.matchAll(pattern2);
    for (const match of matches2) {
      deadlines.push(match[0]);
    }

    return deadlines;
  }

  // ============================================
  // MÉTHODE 5 : Traiter un email
  // ============================================
  // Extrait toutes les infos utiles d'un email
  
  processEmail(email) {
    const projectNo = this.extractProjectNumber(email.subject);
    const priority = this.decidePriority(email);
    const deadlines = this.extractDeadlines(email.body);

    return {
      id: email.id,  // ID unique du mail (pour éviter les doublons)
      source: 'Email',  // Source = Email (vs WeChat)
      projectNo: projectNo,  // Numéro de projet (clé d'union)
      projectInfo: projectNo ? config.getProjectInfo(projectNo) : null,
      priority: priority,  // URGENT / HIGH / NORMAL
      from: email.from,  // Expéditeur
      subject: email.subject,  // Objet du mail
      body: email.body,  // Corps du mail (résumé)
      receivedAt: email.receivedDateTime,  // Date de réception
      deadlines: deadlines,  // Dates mentionnées
      hasAttachments: email.hasAttachments,  // Vrai si PJ/liens
    };
  }

  // ============================================
  // MÉTHODE 6 : Traiter tous les emails
  // ============================================
  // Retourne une liste d'objets structurés
  
  async getAllProcessedEmails() {
    const emails = await this.fetchEmails();
    
    // Applique processEmail() à tous les emails
    const processed = emails.map(email => this.processEmail(email));
    
    // Filtre juste les emails avec un numéro de projet
    // (sinon on peut pas les coupler avec WeChat)
    const withProject = processed.filter(e => e.projectNo);
    
    console.log(`✅ ${withProject.length} emails avec numéro de projet identifiés`);
    
    return withProject;
  }

  // ============================================
  // DONNÉES DE TEST
  // ============================================
  // Pour Phase 1, on simule avec des emails de test
  // (À remplacer par M365 MCP plus tard)
  
  getTestEmails() {
    return [
      {
        id: 'email-001',
        from: 'sandra.bastiat@media6.com',
        subject: '3200_CHOPARD_Popup store - URGENT design validation',
        body: `Hi team,

Popup store design needs validation urgently.
Deadline: 31 Aug before 17h.

Sandra`,
        receivedDateTime: new Date(Date.now() - 2 * 60 * 60 * 1000),  // Il y a 2h
        hasAttachments: false,
      },
      {
        id: 'email-002',
        from: 'sylvia.chen@media6.com',
        subject: '3045_JLC_JAPAN GINZA SIX - Urgent request for animation',
        body: `Hi Sandra,

No worry, I checked with bonder, lead time is 4-5 weeks.
Customer needs to receive by 3rd Aug.
I will also remind Yuko today.

Sylvia`,
        receivedDateTime: new Date(Date.now() - 5 * 60 * 60 * 1000),  // Il y a 5h
        hasAttachments: false,
      },
      {
        id: 'email-003',
        from: 'sophie.song@media6.com',
        subject: '3231_CHAUMET_AO Josephine - Brief analysis',
        body: `Hi Sohayb,

Brief is analyzed by Sylvie for CHAUMET.
Can we increase diameter of base if necessary?
Keep it thin (2/3 mm height).

Sophie`,
        receivedDateTime: new Date(Date.now() - 10 * 60 * 60 * 1000),  // Il y a 10h
        hasAttachments: true,
      },
      {
        id: 'email-004',
        from: 'rambo.zhou@media6.com',
        subject: '3224_APxMedia6_Crafting Time Winter 2026 - Props quotation',
        body: `Hi Sophie,

For the last XMAS decoration set we proposed.
We produced all in resin, low cost version.

Rambo`,
        receivedDateTime: new Date(Date.now() - 15 * 60 * 60 * 1000),  // Il y a 15h
        hasAttachments: false,
      },
    ];
  }
}

// ============================================
// EXPORT
// ============================================
// Exporte la classe pour que main.js puisse l'utiliser

module.exports = EmailReader;
