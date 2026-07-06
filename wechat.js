// ============================================
// WECHAT.JS - Traitement des messages WeChat
// ============================================
// Ce fichier :
// 1. Reçoit les messages via webhook
// 2. Extrait le numéro de projet du nom du groupe
// 3. Détecte si c'est une mention @Sohayb/@Soso
// 4. Détecte les photos et marque pour review
// 5. Retourne une liste formatée

const config = require('./config');

// ============================================
// CLASSE : WeChatProcessor
// ============================================
// S'occupe de tous les messages WeChat

class WeChatProcessor {
  constructor() {
    // En Phase 1, on va stocker les messages reçus ici
    this.messages = [];
    // En Phase 2, on aura un vrai webhook WeChat
  }

  // ============================================
  // MÉTHODE 1 : Traiter un message WeChat reçu
  // ============================================
  // Appelée chaque fois qu'un message arrive via webhook
  
  async processWeChatMessage(webhookData) {
    try {
      console.log('💬 Message WeChat reçu:', webhookData);

      // Extrait les infos du webhook
      const message = {
        id: webhookData.msg_id || webhookData.id,
        groupName: webhookData.group_name || webhookData.groupName,
        sender: webhookData.sender || webhookData.from,
        text: webhookData.text || webhookData.content,
        mediaFiles: webhookData.media || [],  // Photos/vidéos
        timestamp: new Date(webhookData.timestamp * 1000 || Date.now()),
        isMention: false,
        isPhoto: false,
      };

      // Extrait le numéro de projet du nom du groupe
      message.projectNo = this.extractProjectNumber(message.groupName);

      // Cherche si @Sohayb ou @Soso est mentionné
      message.isMention = this.checkMention(message.text);

      // Détecte s'il y a des photos
      message.isPhoto = message.mediaFiles.length > 0;

      // Décide la priorité
      message.priority = this.decidePriority(message);

      // Détecte si un producteur est dans le groupe (flag BF)
      message.producerInGroup = this.checkProducerFlag(message.groupName);

      return message;

    } catch (error) {
      console.error('❌ Erreur traitement WeChat:', error);
      return null;
    }
  }

  // ============================================
  // MÉTHODE 2 : Extraire le numéro de projet
  // ============================================
  // Le nom du groupe commence par [PROJECT_NUMBER]_
  // Ex : "3200_CHOPARD_HAPPY_DIAMOND" → "3200"
  
  extractProjectNumber(groupName) {
    // Utilise la regex définie dans config.js
    const match = groupName.match(config.WECHAT_CONFIG.GROUP_NAME_PATTERN);
    return match ? match[1] : null;
  }

  // ============================================
  // MÉTHODE 3 : Vérifier si @Sohayb est mentionné
  // ============================================
  // Cherche @Sohayb ou @Soso dans le message
  
  checkMention(text) {
    if (!text) return false;
    
    // Cherche chacune des mentions
    for (const mention of config.WECHAT_CONFIG.USER_MENTIONS) {
      if (text.includes(mention)) {
        return true;
      }
    }
    return false;
  }

  // ============================================
  // MÉTHODE 4 : Détecte si le producteur est dans le groupe
  // ============================================
  // Si "BF" dans le nom du groupe → producteur présent
  
  checkProducerFlag(groupName) {
    return groupName.includes(config.WECHAT_CONFIG.PRODUCER_FLAG);
  }

  // ============================================
  // MÉTHODE 5 : Décider la priorité
  // ============================================
  // Plus complexe que l'email car on doit aussi vérifier la mention
  
  decidePriority(message) {
    // 🔴 URGENT si :
    // - @Sohayb/@Soso mentionné
    if (message.isMention) {
      return 'URGENT';
    }

    // 🟡 HIGH si :
    // - Message a des photos (à regarder)
    if (message.isPhoto) {
      return 'HIGH';
    }

    // - Ou tout message dans les 12 dernières heures
    // (on va vérifier ça plus tard au moment du résumé)

    // 🟢 NORMAL = tout le reste
    return 'NORMAL';
  }

  // ============================================
  // MÉTHODE 6 : Formater un message pour le résumé
  // ============================================
  // Retourne un objet structuré prêt à afficher
  
  formatForSummary(message) {
    let summary = '';

    // Titre du message
    if (message.isPhoto && message.mediaFiles.length > 0) {
      summary += `📸 ${message.mediaFiles.length} photo(s) à vérifier`;
    } else if (message.isMention) {
      summary += `@Mention : ${message.text.substring(0, 100)}`;
    } else {
      summary += message.text.substring(0, 150);
    }

    if (message.text.length > 150) {
      summary += '...';
    }

    return {
      id: message.id,
      source: 'WeChat',
      projectNo: message.projectNo,
      projectInfo: message.projectNo ? config.getProjectInfo(message.projectNo) : null,
      priority: message.priority,
      groupName: message.groupName,
      sender: message.sender,
      text: summary,
      mediaCount: message.mediaFiles.length,
      isMention: message.isMention,
      isPhoto: message.isPhoto,
      producerInGroup: message.producerInGroup,
      receivedAt: message.timestamp,
      action: message.isPhoto ? 'Review photos + add to Media6 Drive' : 'Review message',
    };
  }

  // ============================================
  // MÉTHODE 7 : Obtenir tous les messages récents
  // ============================================
  // Filtre les messages des 12 dernières heures
  
  getRecentMessages() {
    const now = new Date();
    const lookbackHours = config.WECHAT_CONFIG.MESSAGE_LOOKBACK_HOURS;
    const cutoffTime = new Date(now.getTime() - lookbackHours * 60 * 60 * 1000);

    const recent = this.messages.filter(msg => 
      msg.timestamp >= cutoffTime
    );

    console.log(`✅ ${recent.length} messages WeChat récents (${lookbackHours}h)`);
    
    return recent;
  }

  // ============================================
  // MÉTHODE 8 : Ajouter un message stocké
  // ============================================
  // En Phase 1, on simule en ajoutant des messages de test
  
  addMessage(message) {
    this.messages.push(message);
  }

  // ============================================
  // DONNÉES DE TEST
  // ============================================
  // Messages de test pour Phase 1
  
  getTestMessages() {
    return [
      {
        id: 'wechat-001',
        groupName: '3200_CHOPARD_HAPPY_DIAMOND_POP',
        sender: 'R Zhou',
        text: '[Photo]',  // Indique une photo
        mediaFiles: [{ type: 'image', filename: 'sample1.jpg' }],
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),  // Il y a 1h
      },
      {
        id: 'wechat-002',
        groupName: '3203_HENNESY_GOAT_DISPLAY',
        sender: 'Amandine campos',
        text: 'What is the need',
        mediaFiles: [],
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),  // Il y a 2h
      },
      {
        id: 'wechat-003',
        groupName: '3164_LV_W3_TRAIN_BF',  // BF = producer présent
        sender: 'Jack Z',
        text: 'okay, so should we sign or should i just send this and they sign and fill in the rest?',
        mediaFiles: [],
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),  // Il y a 3h
      },
      {
        id: 'wechat-004',
        groupName: '3231_CHAUMET_JOSEPHINE',
        sender: 'Tom',
        text: '@Sohayb pls find updated drawing for the glorifier as out size is DIA150mm, sample also follow this size.',
        mediaFiles: [],
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),  // Il y a 4h
      },
      {
        id: 'wechat-005',
        groupName: '3145_CHOPARD_HAPPY_DIAMONDS_ANIM',
        sender: 'Tom',
        text: '@sandra bastiat_Media6 pls find updated drawing for the glorifier',
        mediaFiles: [],
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),  // Il y a 5h
      },
    ];
  }

  // ============================================
  // MÉTHODE 9 : Initialiser avec données de test
  // ============================================
  // Pour Phase 1, charge les messages de test
  
  async loadTestData() {
    const testMessages = this.getTestMessages();
    
    for (const testMsg of testMessages) {
      const processed = await this.processWeChatMessage(testMsg);
      if (processed) {
        this.messages.push(processed);
      }
    }
    
    console.log(`✅ ${this.messages.length} messages de test chargés`);
  }
}

// ============================================
// SETUP DU WEBHOOK (Phase 2)
// ============================================
// Ce code sera activé quand tu configureras le webhook WeChat
// Pour Phase 1, c'est juste du pseudo-code

/*
EXEMPLE DE SETUP WEBHOOK (à faire plus tard) :

const express = require('express');
const app = express();

app.post('/wechat/webhook', async (req, res) => {
  // Vérifie que le webhook vient vraiment de WeChat
  // (signature + token secret)
  
  const wechatProcessor = new WeChatProcessor();
  const message = await wechatProcessor.processWeChatMessage(req.body);
  
  // Stocke le message
  wechatProcessor.addMessage(message);
  
  // Retourne OK à WeChat
  res.status(200).json({ ok: true });
});

app.listen(config.RUNTIME_CONFIG.PORT, () => {
  console.log(`🔔 Webhook WeChat écoute sur port ${config.RUNTIME_CONFIG.PORT}`);
});
*/

// ============================================
// EXPORT
// ============================================

module.exports = WeChatProcessor;
