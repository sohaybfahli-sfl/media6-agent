const axios = require('axios');

let tokenCache = null;
let tokenExpiry = null;

async function getAccessToken() {
  // Return cached token if still valid
  if (tokenCache && tokenExpiry && new Date() < tokenExpiry) {
    return tokenCache;
  }

  try {
    const clientId = process.env.AZURE_CLIENT_ID;
    const clientSecret = process.env.AZURE_CLIENT_SECRET;
    const tenantId = process.env.AZURE_TENANT_ID;

    if (!clientId || !clientSecret || !tenantId) {
      throw new Error('Missing Azure credentials in environment variables');
    }

    const response = await axios.post(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials'
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    tokenCache = response.data.access_token;
    // Set expiry to 55 minutes (token is valid for 60 minutes)
    tokenExpiry = new Date(Date.now() + 55 * 60 * 1000);

    console.log('🔐 Azure token acquired');
    return tokenCache;
  } catch (error) {
    console.error('❌ Authentication error:', error.message);
    throw error;
  }
}

module.exports = { getAccessToken };
