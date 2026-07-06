// ============================================
// PROCESSOR.JS - Traitement & Couplage des données
// ============================================
// Ce fichier :
// 1. Reçoit les emails et messages WeChat
// 2. Les couple par numéro de projet (4-digit)
// 3. Évite les doublons
// 4. Crée une to-do list formatée
// 5. Prépare les calendrier events

const config = require('./config');
const fs = require('fs');
const path = require('path');

// ============================================
// CLASSE : DataProcessor
// ============================================
// Traite et organise toutes les données

class DataProcessor {
  constructor() {
    // Stocke les IDs des messages déjà traités (anti-doublons)
    this.processedMessages = new Map();  // { id => timestamp }
    
    // Stocke les items finaux (email + wechat couplés)
    this.todoItems = [];
    
    // Charge les IDs déjà traités depuis le fichier
    this.loadProcessedMessages();
  }

  // ============================================
  // MÉTHODE 1 : Charger les messages déjà traités
  // ============================================
  // Permet d'éviter les doublons même après un redémarrage
  // Stock dans un fichier JSON sur le serveur
  
  loadProcessedMessages() {
    try {
      const filePath = config.RUNTIME_CONFIG.PROCESSED_MESSAGES_FILE;
      
      // Si le fichier existe, charge-le
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(data);
        
        // Reconvertit en Map
        this.processedMessages = new Map(Object.entries(parsed));
        console.log(`✅ ${this.processedMessages.size} messages précédents chargés`);
      }
    } catch (error) {
      console.error('⚠️ Erreur chargement messages traités:', error);
      this.processedMessages = new Map();
    }
  }

  // ============================================
  // MÉTHODE 2 : Sauvegarder les messages traités
  // ============================================
  // Sauvegarde dans le fichier JSON
  
  saveProcessedMessages() {
    try {
      const filePath = config.RUNTIME_CONFIG.PROCESSED_MESSAGES_FILE;
      
      // Convertit la Map en objet normal
      const obj = Object.fromEntries(this.processedMessages);
      
      // Écrit dans le fichier
      fs.writeFileSync(filePath, JSON.stringify(obj, null, 2));
      console.log(`💾 Messages traités sauvegardés (${this.processedMessages.size})`);
    } catch (error) {
      console.error('❌ Erreur sauvegarde messages traités:', error);
    }
  }

  // ============================================
  // MÉTHODE 3 : Vérifier si un message est déjà traité
  // ============================================
  // Retourne true si on a déjà vu ce message
  
  isMessageProcessed(messageId) {
    return this.processedMessages.has(messageId);
  }

  // ============================================
  // MÉTHODE 4 : Marquer un message comme traité
  // ============================================
  // Ajoute à la liste des traités
  
  markAsProcessed(messageId) {
    this.processedMessages.set(messageId, new Date().toISOString());
  }

  // ============================================
  // MÉTHODE 5 : Traiter les emails
  // ============================================
  // Filtre les doublons et retourne les nouveaux
  
  processEmails(emailList) {
    console.log(`\n📧 Traitement ${emailList.length} emails...`);
    
    const newEmails = [];
    
    for (const email of emailList) {
      // Ignore si déjà traité
      if (this.isMessageProcessed(email.id)) {
        console.log(`  ⏭️  Email ${email.id} déjà traité (skip)`);
        continue;
      }
      
      // Marque comme traité
      this.markAsProcessed(email.id);
      newEmails.push(email);
      console.log(`  ✅ Email ${email.projectNo} de ${email.from} (${email.priority})`);
    }
    
    console.log(`✅ ${newEmails.length} nouveaux emails à traiter`);
    return newEmails;
  }

  // ============================================
  // MÉTHODE 6 : Traiter les messages WeChat
  // ============================================
  // Même logique que les emails
  
  processWeChatMessages(messageList) {
    console.log(`\n💬 Traitement ${messageList.length} messages WeChat...`);
    
    const newMessages = [];
    
    for (const msg of messageList) {
      // Ignore si déjà traité
      if (this.isMessageProcessed(msg.id)) {
        console.log(`  ⏭️  Message ${msg.id} déjà traité (skip)`);
        continue;
      }
      
      // Marque comme traité
      this.markAsProcessed(msg.id);
      newMessages.push(msg);
      console.log(`  ✅ WeChat ${msg.projectNo} de ${msg.sender} (${msg.priority})`);
    }
    
    console.log(`✅ ${newMessages.length} nouveaux messages WeChat à traiter`);
    return newMessages;
  }

  // ============================================
  // MÉTHODE 7 : COUPLER Email + WeChat par projet
  // ============================================
  // C'est la magie ! On lie les deux sources ensemble
  
  // Exemple :
  // Email: "3200_CHOPARD_Popup" from Sandra
  // WeChat: "3200_CHOPARD_POPUP" with 2 photos
  // → 1 seul item avec contexte des 2 sources
  
  coupleEmailsAndWeChat(emails, wechatMessages) {
    console.log(`\n🔗 Couplage Email + WeChat...`);
    
    // Crée des maps pour accès rapide par numéro de projet
    const emailsByProject = new Map();  // { projectNo => [emails] }
    const wechatByProject = new Map();  // { projectNo => [messages] }
    
    // Remplit les maps avec les emails
    for (const email of emails) {
      if (!email.projectNo) continue;
      
      if (!emailsByProject.has(email.projectNo)) {
        emailsByProject.set(email.projectNo, []);
      }
      emailsByProject.get(email.projectNo).push(email);
    }
    
    // Remplit les maps avec les messages WeChat
    for (const msg of wechatMessages) {
      if (!msg.projectNo) continue;
      
      if (!wechatByProject.has(msg.projectNo)) {
        wechatByProject.set(msg.projectNo, []);
      }
      wechatByProject.get(msg.projectNo).push(msg);
    }
    
    // Maintenant crée les items couplés
    const coupledItems = [];
    const allProjectNumbers = new Set([
      ...emailsByProject.keys(),
      ...wechatByProject.keys()
    ]);
    
    for (const projectNo of allProjectNumbers) {
      const projectEmails = emailsByProject.get(projectNo) || [];
      const projectMessages = wechatByProject.get(projectNo) || [];
      
      // Crée 1 seul item par projet (avec infos des 2 sources)
      const item = {
        projectNo: projectNo,
        projectInfo: config.getProjectInfo(projectNo),
        emails: projectEmails,
        wechatMessages: projectMessages,
        priority: this.determinePriority(projectEmails, projectMessages),
        actions: [],
        createdAt: new Date(),
      };
      
      // Ajoute les actions
      if (projectEmails.length > 0) {
        item.actions.push({
          source: 'Email',
          count: projectEmails.length,
          description: this.summarizeEmails(projectEmails),
          links: projectEmails.map(e => ({ from: e.from, subject: e.subject })),
        });
      }
      
      if (projectMessages.length > 0) {
        item.actions.push({
          source: 'WeChat',
          count: projectMessages.length,
          description: this.summarizeWeChatMessages(projectMessages),
          photos: projectMessages.reduce((sum, m) => sum + m.mediaCount, 0),
          mentions: projectMessages.filter(m => m.isMention).length,
        });
      }
      
      coupledItems.push(item);
      console.log(`  ✅ Projet ${projectNo}: ${projectEmails.length} emails + ${projectMessages.length} messages`);
    }
    
    console.log(`✅ ${coupledItems.length} items couplés Email + WeChat`);
    return coupledItems;
  }

  // ============================================
  // MÉTHODE 8 : Déterminer la priorité finale
  // ============================================
  // Combine les priorités des 2 sources
  
  determinePriority(emails, wechatMessages) {
    // Si AU MOINS UN est URGENT → tout est URGENT
    const hasUrgent = [
      ...emails,
      ...wechatMessages
    ].some(item => item.priority === 'URGENT');
    
    if (hasUrgent) return 'URGENT';
    
    // Si AU MOINS UN est HIGH → tout est HIGH
    const hasHigh = [
      ...emails,
      ...wechatMessages
    ].some(item => item.priority === 'HIGH');
    
    if (hasHigh) return 'HIGH';
    
    // Sinon NORMAL
    return 'NORMAL';
  }

  // ============================================
  // MÉTHODE 9 : Résumer les emails
  // ============================================
  // Crée un résumé court des emails pour cet projet
  
  summarizeEmails(emails) {
    if (emails.length === 0) return '';
    
    // Prend le plus récent
    const latest = emails.sort((a, b) => 
      new Date(b.receivedAt) - new Date(a.receivedAt)
    )[0];
    
    return latest.subject;
  }

  // ============================================
  // MÉTHODE 10 : Résumer les messages WeChat
  // ============================================
  // Crée un résumé court des messages
  
  summarizeWeChatMessages(messages) {
    if (messages.length === 0) return '';
    
    const photoCount = messages.reduce((sum, m) => sum + m.mediaCount, 0);
    const mentionCount = messages.filter(m => m.isMention).length;
    const textMessages = messages.filter(m => !m.isPhoto);
    
    let summary = '';
    if (photoCount > 0) summary += `${photoCount} photo(s)`;
    if (textMessages.length > 0) summary += (summary ? ' + ' : '') + `${textMessages.length} message(s)`;
    if (mentionCount > 0) summary += ` (@Mention ×${mentionCount})`;
    
    return summary || 'Message WeChat';
  }

  // ============================================
  // MÉTHODE 11 : Organiser par priorité
  // ============================================
  // Trie les items par priorité pour le résumé
  
  sortByPriority(items) {
    const priorityOrder = { URGENT: 0, HIGH: 1, NORMAL: 2 };
    
    return items.sort((a, b) => 
      priorityOrder[a.priority] - priorityOrder[b.priority]
    );
  }

  // ============================================
  // MÉTHODE 12 : Créer les événements calendrier
  // ============================================
  // Extrait les dates et crée des events Outlook
  
  createCalendarEvents(items) {
    const events = [];
    
    for (const item of items) {
      // Cherche toutes les deadlines mentionnées
      for (const email of item.emails) {
        if (email.deadlines && email.deadlines.length > 0) {
          for (const deadline of email.deadlines) {
            events.push({
              projectNo: item.projectNo,
              projectName: item.projectInfo.description,
              title: `📋 ${item.projectInfo.customer} - ${item.projectInfo.description}`,
              description: `Projet ${item.projectNo}: ${email.subject}`,
              dateString: deadline,  // "31 Aug" ou "15 juillet"
              source: 'Email',
              priority: item.priority,
            });
          }
        }
      }
    }
    
    console.log(`📅 ${events.length} événements calendrier identifiés`);
    return events;
  }

  // ============================================
  // MÉTHODE 13 : Pipeline complète (main)
  // ============================================
  // Orchestration : Email → WeChat → Couple → Trie → Calendrier
  
  async processAllData(emails, wechatMessages) {
    console.log('🚀 DÉBUT DU TRAITEMENT COMPLET...\n');
    
    // Étape 1 : Filtrer les doublons
    const newEmails = this.processEmails(emails);
    const newWeChat = this.processWeChatMessages(wechatMessages);
    
    // Étape 2 : Coupler par projet
    const coupledItems = this.coupleEmailsAndWeChat(newEmails, newWeChat);
    
    // Étape 3 : Trier par priorité
    const sortedItems = this.sortByPriority(coupledItems);
    
    // Étape 4 : Créer les événements calendrier
    const calendarEvents = this.createCalendarEvents(sortedItems);
    
    // Étape 5 : Sauvegarder les IDs traités
    this.saveProcessedMessages();
    
    // Retourne tout ce qu'il faut pour le résumé
    console.log('\n✅ TRAITEMENT COMPLET TERMINÉ\n');
    
    return {
      items: sortedItems,
      calendarEvents: calendarEvents,
      summary: {
        totalEmails: newEmails.length,
        totalWeChat: newWeChat.length,
        totalProjects: sortedItems.length,
        urgentCount: sortedItems.filter(i => i.priority === 'URGENT').length,
        highCount: sortedItems.filter(i => i.priority === 'HIGH').length,
        normalCount: sortedItems.filter(i => i.priority === 'NORMAL').length,
      }
    };
  }

  // ============================================
  // MÉTHODE 14 : Formater pour affichage HTML
  // ============================================
  // Prépare le contenu du résumé (on verra dans sender.js)
  
  formatForHTML(processedData) {
    let html = '';
    
    for (const item of processedData.items) {
      const priorityEmoji = {
        URGENT: '🔴',
        HIGH: '🟡',
        NORMAL: '🟢'
      }[item.priority];
      
      html += `<div class="project-item priority-${item.priority}">
        <h3>${priorityEmoji} ${item.projectNo} - ${item.projectInfo.customer}</h3>
        <p><strong>${item.projectInfo.description}</strong></p>
        <p>PM: ${item.projectInfo.pm} | Status: ${item.projectInfo.status}</p>
        
        <div class="actions">`;
      
      // Ajoute les actions (emails + weChat)
      for (const action of item.actions) {
        if (action.source === 'Email') {
          html += `<div class="email-action">
            📧 ${action.count} email(s): ${action.description}
          </div>`;
        } else {
          html += `<div class="wechat-action">
            💬 ${action.count} message(s) WeChat`;
          
          if (action.photos > 0) {
            html += ` | 📸 ${action.photos} photo(s) à vérifier`;
          }
          
          if (action.mentions > 0) {
            html += ` | @Mention ×${action.mentions}`;
          }
          
          html += `</div>`;
        }
      }
      
      html += `</div></div>`;
    }
    
    return html;
  }
}

// ============================================
// EXPORT
// ============================================

module.exports = DataProcessor;
