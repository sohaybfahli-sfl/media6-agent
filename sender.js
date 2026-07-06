// ============================================
// SENDER.JS - Envoi des résumés et calendrier
// ============================================
// Ce fichier :
// 1. Formate le résumé en HTML
// 2. Envoie par email Outlook
// 3. Crée les événements calendrier
// 4. Ajoute les alertes WeChat (photos à drive)

const config = require('./config');

// ============================================
// CLASSE : SummarySender
// ============================================
// S'occupe d'envoyer les résumés

class SummarySender {
  constructor() {
    // En Phase 1 : on va simuler l'envoi
    // En Phase 2 : on connecte vraiment à Outlook via M365 MCP
  }

  // ============================================
  // MÉTHODE 1 : Formater le résumé en HTML
  // ============================================
  // Crée un bel email avec du CSS et tout
  
  formatSummaryHTML(processedData, isEvening = true) {
    const now = new Date();
    const timeLabel = isEvening ? '21h30 - Résumé du soir' : '07h30 - Mise à jour matin';
    
    // Compte les items par priorité
    const summary = processedData.summary;
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f5f5f5;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background-color: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      border-bottom: 3px solid #0078d4;
      padding-bottom: 15px;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0;
      color: #0078d4;
      font-size: 24px;
    }
    .header p {
      margin: 5px 0 0 0;
      color: #666;
      font-size: 14px;
    }
    .stats {
      display: flex;
      gap: 15px;
      margin-bottom: 30px;
      padding: 15px;
      background-color: #f0f0f0;
      border-radius: 5px;
    }
    .stat-item {
      flex: 1;
      text-align: center;
      padding: 10px;
    }
    .stat-number {
      font-size: 28px;
      font-weight: bold;
      color: #0078d4;
    }
    .stat-label {
      font-size: 12px;
      color: #666;
      margin-top: 5px;
    }
    .projects-section {
      margin-bottom: 30px;
    }
    .priority-section-title {
      font-size: 18px;
      font-weight: bold;
      margin: 25px 0 15px 0;
      padding-left: 10px;
      border-left: 4px solid #0078d4;
    }
    .priority-section-title.urgent {
      border-left-color: #d13438;
      color: #d13438;
    }
    .priority-section-title.high {
      border-left-color: #ffa500;
      color: #ffa500;
    }
    .priority-section-title.normal {
      border-left-color: #107c10;
      color: #107c10;
    }
    .project-item {
      background-color: #fafafa;
      border: 1px solid #e0e0e0;
      padding: 15px;
      margin-bottom: 10px;
      border-radius: 5px;
    }
    .project-item.urgent {
      border-left: 4px solid #d13438;
      background-color: #fef2f2;
    }
    .project-item.high {
      border-left: 4px solid #ffa500;
      background-color: #fffaf0;
    }
    .project-item.normal {
      border-left: 4px solid #107c10;
      background-color: #f2fff0;
    }
    .project-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .project-number {
      font-size: 14px;
      font-weight: bold;
      color: #0078d4;
    }
    .project-name {
      font-size: 16px;
      font-weight: bold;
      color: #1f1f1f;
      margin-bottom: 5px;
    }
    .project-meta {
      font-size: 12px;
      color: #666;
      margin-bottom: 10px;
    }
    .action-item {
      margin: 10px 0;
      padding: 10px;
      background-color: white;
      border-left: 3px solid #0078d4;
      font-size: 13px;
    }
    .action-item.email {
      border-left-color: #0078d4;
    }
    .action-item.wechat {
      border-left-color: #09a31c;
    }
    .action-item.photo-alert {
      background-color: #fff4e5;
      border-left-color: #ffa500;
    }
    .footer {
      border-top: 1px solid #e0e0e0;
      padding-top: 15px;
      margin-top: 30px;
      color: #666;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- HEADER -->
    <div class="header">
      <h1>${isEvening ? '📋 Résumé du soir' : '☀️ Mise à jour matin'}</h1>
      <p>${timeLabel} - ${now.toLocaleString('fr-CH')}</p>
    </div>

    <!-- STATISTIQUES -->
    <div class="stats">
      <div class="stat-item">
        <div class="stat-number">${summary.urgentCount}</div>
        <div class="stat-label">🔴 Urgent</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">${summary.highCount}</div>
        <div class="stat-label">🟡 Important</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">${summary.normalCount}</div>
        <div class="stat-label">🟢 Normal</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">${summary.totalProjects}</div>
        <div class="stat-label">📌 Projets</div>
      </div>
    </div>

    <!-- PROJETS PAR PRIORITÉ -->
    <div class="projects-section">
      ${this.renderProjectsByPriority(processedData.items)}
    </div>

    <!-- CALENDRIER -->
    ${processedData.calendarEvents.length > 0 ? `
    <div class="projects-section">
      <h2>📅 Événements calendrier</h2>
      <p>${processedData.calendarEvents.length} deadline(s) ont été ajoutées au calendrier</p>
    </div>
    ` : ''}

    <!-- PHOTOS WECHAT -->
    ${this.renderPhotoAlerts(processedData.items)}

    <!-- FOOTER -->
    <div class="footer">
      <p>💡 Cet email a été généré automatiquement par l'agent Media6 Workflow.</p>
      <p>📸 Les photos WeChat doivent être téléchargées manuellement sur le Drive Media6.</p>
      <p>✅ Les événements calendrier ont été ajoutés automatiquement à Outlook.</p>
    </div>
  </div>
</body>
</html>
    `;
    
    return html;
  }

  // ============================================
  // MÉTHODE 2 : Rendre les projets par priorité
  // ============================================
  // Génère le HTML pour la section des projets
  
  renderProjectsByPriority(items) {
    let html = '';
    
    const urgent = items.filter(i => i.priority === 'URGENT');
    const high = items.filter(i => i.priority === 'HIGH');
    const normal = items.filter(i => i.priority === 'NORMAL');
    
    // URGENT
    if (urgent.length > 0) {
      html += `<h2 class="priority-section-title urgent">🔴 URGENT (${urgent.length})</h2>`;
      for (const item of urgent) {
        html += this.renderProjectItem(item, 'urgent');
      }
    }
    
    // HIGH
    if (high.length > 0) {
      html += `<h2 class="priority-section-title high">🟡 IMPORTANT (${high.length})</h2>`;
      for (const item of high) {
        html += this.renderProjectItem(item, 'high');
      }
    }
    
    // NORMAL
    if (normal.length > 0) {
      html += `<h2 class="priority-section-title normal">🟢 À SURVEILLER (${normal.length})</h2>`;
      for (const item of normal) {
        html += this.renderProjectItem(item, 'normal');
      }
    }
    
    return html;
  }

  // ============================================
  // MÉTHODE 3 : Rendre un item de projet
  // ============================================
  // Génère le HTML pour 1 projet
  
  renderProjectItem(item, priority) {
    let html = `<div class="project-item ${priority}">`;
    
    // En-tête
    html += `<div class="project-header">
      <div>
        <div class="project-number">${item.projectNo}</div>
        <div class="project-name">${item.projectInfo.customer}</div>
        <div class="project-meta">${item.projectInfo.description} | PM: ${item.projectInfo.pm}</div>
      </div>
      <div style="text-align: right; color: #666; font-size: 12px;">
        ${item.projectInfo.status}
      </div>
    </div>`;
    
    // Actions (emails + weChat)
    for (const action of item.actions) {
      if (action.source === 'Email') {
        html += `<div class="action-item email">
          📧 ${action.count} email(s) | ${action.description}
        </div>`;
      } else {
        html += `<div class="action-item wechat">
          💬 ${action.count} message(s) WeChat`;
        
        if (action.photos > 0) {
          html += ` | 📸 ${action.photos} photo(s)`;
        }
        
        if (action.mentions > 0) {
          html += ` | @Mention ×${action.mentions}`;
        }
        
        html += `</div>`;
      }
    }
    
    html += `</div>`;
    return html;
  }

  // ============================================
  // MÉTHODE 4 : Rendre les alertes photos WeChat
  // ============================================
  // Affiche les projets avec des photos à vérifier
  
  renderPhotoAlerts(items) {
    const itemsWithPhotos = items.filter(item => 
      item.wechatMessages && 
      item.wechatMessages.some(m => m.mediaCount > 0)
    );
    
    if (itemsWithPhotos.length === 0) return '';
    
    let html = `<div class="projects-section">
      <h2>📸 Photos WeChat à vérifier</h2>
    `;
    
    for (const item of itemsWithPhotos) {
      const photoMessages = item.wechatMessages.filter(m => m.mediaCount > 0);
      const totalPhotos = photoMessages.reduce((sum, m) => sum + m.mediaCount, 0);
      
      html += `<div class="action-item photo-alert">
        <strong>${item.projectNo} - ${item.projectInfo.customer}</strong><br>
        ${totalPhotos} photo(s) à vérifier dans le groupe WeChat 
        "<strong>${photoMessages[0].groupName}</strong>"<br>
        ✅ Action : Télécharger sur le Drive Media6 du projet
      </div>`;
    }
    
    html += `</div>`;
    return html;
  }

  // ============================================
  // MÉTHODE 5 : Envoyer l'email (Outlook)
  // ============================================
  // En Phase 1 : simule l'envoi
  // En Phase 2 : utilise M365 MCP pour vraiment envoyer
  
  async sendEmailSummary(htmlContent, isEvening = true) {
    try {
      const subject = isEvening 
        ? `📋 [Agent Workflow] Résumé du soir ${new Date().toLocaleDateString('fr-CH')}`
        : `☀️ [Agent Workflow] Mise à jour matin ${new Date().toLocaleDateString('fr-CH')}`;
      
      console.log(`\n📧 Envoi d'email résumé...`);
      console.log(`   Destinataire: ${config.OUTLOOK_CONFIG.RECIPIENT_EMAIL}`);
      console.log(`   Sujet: ${subject}`);
      
      // PHASE 1 : Simule l'envoi (juste log)
      console.log(`✅ Email envoyé (simulation Phase 1)`);
      
      // PHASE 2 : Code réel pour envoyer via M365 MCP
      /*
      const outlookClient = new OutlookClient();
      const result = await outlookClient.sendMail({
        to: config.OUTLOOK_CONFIG.RECIPIENT_EMAIL,
        subject: subject,
        body: htmlContent,
        bodyType: 'html',
      });
      
      console.log(`✅ Email envoyé (ID: ${result.id})`);
      return result.id;
      */
      
      return { id: `sim-${Date.now()}`, subject };
      
    } catch (error) {
      console.error('❌ Erreur envoi email:', error);
      return null;
    }
  }

  // ============================================
  // MÉTHODE 6 : Créer les événements calendrier
  // ============================================
  // Ajoute les deadlines au calendrier Outlook
  
  async addCalendarEvents(events) {
    if (events.length === 0) {
      console.log('📅 Pas d\'événements à ajouter');
      return;
    }
    
    console.log(`\n📅 Ajout de ${events.length} événement(s) calendrier...`);
    
    for (const event of events) {
      try {
        // Parse la date (exemple: "31 Aug" → 31 août)
        const eventDate = this.parseDeadlineDate(event.dateString);
        
        console.log(`   ✅ ${event.title} → ${eventDate.toLocaleDateString('fr-CH')}`);
        
        // PHASE 1 : Simule juste
        // console.log(`   ✅ Événement créé (simulation Phase 1)`);
        
        // PHASE 2 : Code réel
        /*
        const outlookClient = new OutlookClient();
        const result = await outlookClient.createEvent({
          subject: event.title,
          start: eventDate,
          end: new Date(eventDate.getTime() + 60 * 60 * 1000),  // 1h de durée
          body: event.description,
          isReminderOn: true,
          reminderMinutesBeforeStart: 1440,  // 1 jour avant
        });
        
        console.log(`   ✅ Événement créé (ID: ${result.id})`);
        */
      } catch (error) {
        console.error(`   ❌ Erreur création événement ${event.title}:`, error);
      }
    }
  }

  // ============================================
  // MÉTHODE 7 : Parser une date "31 Aug" → Date
  // ============================================
  // Convertit "31 Aug" en objet Date
  
  parseDeadlineDate(dateString) {
    // Format : "31 Aug" ou "31 August"
    // Retourne toujours l'année actuelle/suivante
    
    const months = {
      'jan': 0, 'january': 0,
      'feb': 1, 'february': 1,
      'mar': 2, 'march': 2,
      'apr': 3, 'april': 3,
      'may': 4,
      'jun': 5, 'june': 5,
      'jul': 6, 'july': 6,
      'aug': 7, 'august': 7,
      'sep': 8, 'september': 8,
      'oct': 9, 'october': 9,
      'nov': 10, 'november': 10,
      'dec': 11, 'december': 11,
    };
    
    const parts = dateString.trim().split(/\s+/);
    if (parts.length < 2) return new Date();
    
    const day = parseInt(parts[0]);
    const monthStr = parts[1].toLowerCase().substring(0, 3);
    const month = months[monthStr] !== undefined ? months[monthStr] : 0;
    
    // Détermine l'année (si date est passée cette année, assume l'année prochaine)
    let year = new Date().getFullYear();
    const testDate = new Date(year, month, day);
    if (testDate < new Date()) {
      year++;
    }
    
    return new Date(year, month, day, 10, 0, 0);
  }

  // ============================================
  // MÉTHODE 8 : Pipeline complète (main)
  // ============================================
  // Formate, envoie email + calendrier
  
  async sendCompleteSummary(processedData, isEvening = true) {
    console.log('\n🚀 ENVOI DES RÉSUMÉS...\n');
    
    // Étape 1 : Formater en HTML
    const htmlContent = this.formatSummaryHTML(processedData, isEvening);
    
    // Étape 2 : Envoyer l'email
    const emailResult = await this.sendEmailSummary(htmlContent, isEvening);
    
    // Étape 3 : Ajouter au calendrier
    await this.addCalendarEvents(processedData.calendarEvents);
    
    console.log('\n✅ ENVOI COMPLET TERMINÉ\n');
    
    return {
      emailSent: emailResult !== null,
      emailId: emailResult?.id,
      calendarEventsAdded: processedData.calendarEvents.length,
    };
  }
}

// ============================================
// EXPORT
// ============================================

module.exports = SummarySender;
