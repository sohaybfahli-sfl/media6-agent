const axios = require('axios');
const { getAccessToken } = require('./auth');

async function readEmails(daysBack = 1, limit = 25, offset = 0) {
  try {
    const token = await getAccessToken();
    const dateFilter = new Date();
    dateFilter.setDate(dateFilter.getDate() - daysBack);
    const dateString = dateFilter.toISOString();

    const response = await axios.get(
      'https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages',
      {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          $filter: `receivedDateTime ge '${dateString}'`,
          $top: limit,
          $skip: offset,
          $orderby: 'receivedDateTime desc',
          $select: 'id,subject,from,receivedDateTime,bodyPreview,hasAttachments,importance'
        }
      }
    );

    return response.data.value || [];
  } catch (error) {
    console.error('Error reading emails:', error.message);
    return [];
  }
}

async function getAllEmails() {
  try {
    const token = await getAccessToken();
    let allEmails = [];
    let offset = 0;
    const batchSize = 25;
    const maxIterations = 13; // 13 * 25 = 325 emails

    console.log('📬 Fetching emails in batches of 25...');

    for (let i = 0; i < maxIterations; i++) {
      const response = await axios.get(
        'https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages',
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            $top: batchSize,
            $skip: offset,
            $orderby: 'receivedDateTime desc',
            $select: 'id,subject,from,receivedDateTime,bodyPreview,hasAttachments,importance'
          }
        }
      );

      const batch = response.data.value || [];
      if (batch.length === 0) break;

      allEmails = [...allEmails, ...batch];
      offset += batchSize;

      console.log(`   Batch ${i + 1}: ${batch.length} emails (total: ${allEmails.length})`);

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`✅ Total emails fetched: ${allEmails.length}`);
    return allEmails;
  } catch (error) {
    console.error('Error fetching all emails:', error.message);
    return [];
  }
}

async function getEmailBody(messageId) {
  try {
    const token = await getAccessToken();
    const response = await axios.get(
      `https://graph.microsoft.com/v1.0/me/messages/${messageId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params: { $select: 'body' }
      }
    );

    return response.data.body?.content || '';
  } catch (error) {
    console.error(`Error reading email body for ${messageId}:`, error.message);
    return '';
  }
}

module.exports = {
  readEmails,
  getAllEmails,
  getEmailBody
};
