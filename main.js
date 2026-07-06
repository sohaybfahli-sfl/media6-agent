// ============================================
// MAIN.JS - Orchestration complète de l'agent
// ============================================
// Ce fichier :
// 1. Initialise tous les composants
// 2. Gère le mode BACKFILL (1ère fois)
// 3. Lance les résumés programmés
// 4. Gère le webhook WeChat

const EmailReader = require('./reader');
const WeChatProcessor = require('./wechat');
const DataProcessor = require('./processor');
const SummarySender = require('./sender');
const config = require('./config');
const fs = require('fs');
const path = require('path');

// ============================================
// CLASSE : WorkflowAgent
// ============================================
// L'agent principal qui gère tout

class WorkflowAgent {
  constructor() {
    this.emailReader = new EmailReader();
    this.weChatProcessor = new WeChatProcessor();
    this.dataProcessor = new DataProcessor();
    this.summarySender = new SummarySender();
    this.isFirstRun = this.checkFirstRun();
  }

  // ============================================
  // MÉTHODE 1 : Vérifier si c'est la 1ère exécution
  // ============================================
  // Regarde s'il existe un fichier "first_run_complete"
  
  checkFirstRun() {
    const firstRunFile = path.join(
      config.RUNTIME_CONFIG.PROCESSED_MESSAGES_FILE.replace('processed_messages.json', ''),
      'first_run_complete'
    );
    
    const isFirstRun = !fs.existsSync(firstRunFile);
    
    if (isFirstRun) {
      console.log('\n🚀 PREMIÈRE EXÉCUTION DÉTECTÉE - Mode BACKFILL activé\n');
    } else {
      console.log('\n✅ Exécutions antérieures détectées - Mode NORMAL (24h lookback)\n');
    }
    
    return isFirstRun;
  }

  // ============================================
  // MÉTHODE 2 : Marquer la 1ère exécution comme complète
  // ============================================
  // Crée le fichier de flag
  
  markFirstRunComplete() {
    try {
      const firstRunFile = path.join(
        config.RUNTIME_CONFIG.PROCESSED_MESSAGES_FILE.replace('processed_messages.json', ''),
        'first_run_complete'
      );
      
      fs.writeFileSync(firstRunFile, JSON.stringify({
        completedAt: new Date().toISOString(),
        emailsProcessed: this.dataProcessor.processedMessages.size,
      }));
      
      console.log('✅ Flag de 1ère exécution créé');
    } catch (error) {
      console.error('⚠️ Erreur création flag:', error);
    }
  }

  // ============================================
  // MÉTHODE 3 : Configurer le lookback selon le mode
  // ============================================
  // Si 1ère fois → tout (null), sinon 24h
  
  configureLookback() {
    if (this.isFirstRun) {
      // BACKFILL : Lit TOUTE la boîte
      config.OUTLOOK_CONFIG.LOOKBACK_HOURS = null;  // null = tout
      config.WECHAT_CONFIG.MESSAGE_LOOKBACK_HOURS = null;  // null = tout
      
      console.log('📖 BACKFILL : Lecture de l\'historique COMPLET');
    } else {
      // NORMAL : 24h seulement
      config.OUTLOOK_CONFIG.LOOKBACK_HOURS = 24;
      config.WECHAT_CONFIG.MESSAGE_LOOKBACK_HOURS = 12;
      
      console.log('📖 MODE NORMAL : Lecture des 24 dernières heures');
    }
  }

  // ============================================
  // MÉTHODE 4 : Pipeline complète (le cœur)
  // ============================================
  // Exécute : Lire → Traiter → Coupler → Envoyer
  
  async runPipeline(isEvening = true) {
    try {
      console.log('\n' + '='.repeat(50));
      console.log(`⚙️  EXÉCUTION PIPELINE - ${isEvening ? 'SOIR (21h30)' : 'MATIN (07h30)'}`);
      console.log('='.repeat(50));
      
      // ÉTAPE 1 : Lire les données
      console.log('\n📖 ÉTAPE 1 : LECTURE DES DONNÉES');
      console.log('-'.repeat(50));
      
      const emails = await this.emailReader.getAllProcessedEmails();
      
      // Charge les données WeChat de test pour Phase 1
      // (En Phase 2, ce sera le webhook qui alimentera)
      await this.weChatProcessor.loadTestData();
      const wechatMessages = this.weChatProcessor.getRecentMessages().map(msg => 
        this.weChatProcessor.formatForSummary(msg)
      );
      
      // ÉTAPE 2 : Traiter & Coupler
      console.log('\n🔗 ÉTAPE 2 : TRAITEMENT & COUPLAGE');
      console.log('-'.repeat(50));
      
      const processedData = await this.dataProcessor.processAllData(
        emails,
        wechatMessages
      );
      
      // ÉTAPE 3 : Envoyer le résumé
      console.log('\n📤 ÉTAPE 3 : ENVOI DU RÉSUMÉ');
      console.log('-'.repeat(50));
      
      const sendResult = await this.summarySender.sendCompleteSummary(
        processedData,
        isEvening
      );
      
      console.log('\n' + '='.repeat(50));
      console.log('✅ PIPELINE EXÉCUTÉ AVEC SUCCÈS');
      console.log('='.repeat(50) + '\n');
      
      return {
        success: true,
        emailsSent: sendResult.emailSent,
        calendarEventsAdded: sendResult.calendarEventsAdded,
        itemsProcessed: processedData.items.length,
      };
      
    } catch (error) {
      console.error('\n❌ ERREUR PIPELINE:', error);
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // MÉTHODE 5 : Planifier les résumés récurrents
  // ============================================
  // Lance les résumés à 7h30 et 21h30
  
  scheduleRecurringSummaries() {
    console.log('\n📅 Configuration des résumés programmés...\n');
    
    // Parse les heures de config
    const eveningTime = config.SCHEDULE.EVENING_SUMMARY;  // "21:30"
    const morningTime = config.SCHEDULE.MORNING_REFRESH;   // "07:30"
    
    // Résumé du soir (21h30)
    this.scheduleDaily(eveningTime, () => {
      console.log('\n🌙 Résumé du soir (21h30) déclenché');
      this.runPipeline(true);
    }, 'SOIR');
    
    // Résumé du matin (07h30)
    this.scheduleDaily(morningTime, () => {
      console.log('\n☀️  Résumé du matin (07h30) déclenché');
      this.runPipeline(false);
    }, 'MATIN');
  }

  // ============================================
  // MÉTHODE 6 : Planifier une tâche quotidienne
  // ============================================
  // Lance une fonction à une heure précise chaque jour
  
  scheduleDaily(timeString, callback, label) {
    // Parse "21:30" → { hours: 21, minutes: 30 }
    const [hours, minutes] = timeString.split(':').map(Number);
    
    // Calcule le temps jusqu'à la prochaine exécution
    const now = new Date();
    let next = new Date();
    next.setHours(hours, minutes, 0, 0);
    
    // Si l'heure est passée, la prochaine est demain
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }
    
    const delay = next.getTime() - now.getTime();
    
    console.log(`  ✅ ${label} : ${timeString} Swiss time`);
    console.log(`     Prochaine exécution: ${next.toLocaleString('fr-CH')}`);
    console.log(`     Attente: ${Math.round(delay / 1000 / 60)} minutes\n`);
    
    // Lance un setTimeout pour la première fois
    setTimeout(() => {
      callback();
      
      // Puis répète chaque jour (86400000 ms = 24h)
      setInterval(callback, 86400000);
    }, delay);
  }

  // ============================================
  // MÉTHODE 7 : Setup du webhook WeChat (Phase 2)
  // ============================================
  // En Phase 1, c'est juste du pseudo-code
  
  setupWeChatWebhook() {
    console.log('\n🔔 Configuration du webhook WeChat...');
    
    console.log(`
    ⚠️  IMPORTANT - Configuration WeChat requise:
    
    En Phase 1 (maintenant), les messages WeChat sont simulés.
    
    En Phase 2 (après), tu dois configurer un webhook WeChat:
    
    URL du webhook: ${config.RUNTIME_CONFIG.PUBLIC_URL}/wechat/webhook
    Token/Secret: ${config.RUNTIME_CONFIG.WEBHOOK_SECRET}
    
    Sophie/Rambo en Chine doit configurer ça côté WeChat Business.
    
    Instructions:
    1. Aller dans WeChat Business settings
    2. Ajouter un webhook receiver
    3. URL: ${config.RUNTIME_CONFIG.PUBLIC_URL}/wechat/webhook
    4. Token: ${config.RUNTIME_CONFIG.WEBHOOK_SECRET}
    5. Les messages arriveront en temps réel
    `);
  }

  // ============================================
  // MÉTHODE 8 : Initialisation complète
  // ============================================
  // Lance tout au démarrage
  
  async initialize() {
    console.log('\n' + '='.repeat(50));
    console.log('🚀 INITIALISATION DE L\'AGENT WORKFLOW MEDIA6');
    console.log('='.repeat(50));
    
    // Vérifie si c'est la 1ère fois
    this.configureLookback();
    
    // En Phase 1, lance une exécution immédiate si 1ère fois
    if (this.isFirstRun) {
      console.log('\n⚡ Mode BACKFILL : Exécution immédiate...\n');
      
      // Lance le soir en backfill
      const result = await this.runPipeline(true);
      
      if (result.success) {
        // Marque comme complète
        this.markFirstRunComplete();
        console.log('\n✅ BACKFILL COMPLÉTÉ');
      }
    }
    
    // Configure les résumés récurrents
    this.scheduleRecurringSummaries();
    
    // Setup webhook (informationnel)
    this.setupWeChatWebhook();
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ AGENT DÉMARRÉ ET EN ATTENTE');
    console.log('='.repeat(50));
  }
}

// ============================================
// DÉMARRAGE DE L'APPLICATION
// ============================================
// Lance l'agent quand le script s'exécute

async function main() {
  try {
    const agent = new WorkflowAgent();
    await agent.initialize();
    
    // Garde le processus actif
    console.log('\n💡 Appuyez sur Ctrl+C pour arrêter l\'agent.\n');
    
  } catch (error) {
    console.error('❌ ERREUR INITIALISATION:', error);
    process.exit(1);
  }
}

// Démarre si c'est l'exécution directe
if (require.main === module) {
  main();
}

// Export pour tests/imports
module.exports = { WorkflowAgent, main };
