const BasePlatformService = require('./basePlatformService');
const axios = require('axios');

class FacebookService extends BasePlatformService {
  constructor() {
    super('facebook');
    this.apiBase = 'https://graph.facebook.com/v18.0';
    this.clientId = process.env.FACEBOOK_APP_ID;
    this.clientSecret = process.env.FACEBOOK_APP_SECRET;
  }

  getAuthorizationUrl(redirectUri, state) {
    const scopes = [
      'pages_manage_posts',
      'pages_read_engagement',
      'pages_show_list',
      'public_profile'
    ].join(',');

    return `${this.apiBase}/oauth/authorize?` +
      `client_id=${this.clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${scopes}&` +
      `state=${state}&` +
      `response_type=code`;
  }

  async exchangeCodeForToken(code, redirectUri) {
    try {
      const response = await axios.get(`${this.apiBase}/oauth/access_token`, {
        params: {
          client_id: this.clientId,
          client_secret: this.clientSecret,
          redirect_uri: redirectUri,
          code: code
        }
      });

      const { access_token, expires_in } = response.data;

      const longLivedResponse = await axios.get(`${this.apiBase}/oauth/access_token`, {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          fb_exchange_token: access_token
        }
      });

      return {
        accessToken: longLivedResponse.data.access_token || access_token,
        expiresIn: longLivedResponse.data.expires_in || expires_in,
        tokenType: 'Bearer'
      };
    } catch (error) {
      throw new Error(`Failed to exchange code for token: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async refreshToken(refreshToken) {
    throw new Error('Use exchangeCodeForToken with refresh token if needed');
  }

  async getAccountInfo(accessToken) {
    try {
      const pagesResponse = await axios.get(`${this.apiBase}/me/accounts`, {
        params: {
          access_token: accessToken,
          fields: 'id,name,access_token,picture'
        }
      });

      const pages = pagesResponse.data.data;
      if (!pages || pages.length === 0) {
        throw new Error('No Facebook pages found. Please create a Facebook Page first.');
      }

      const page = pages[0];
      return {
        accountId: page.id,
        accountName: page.name,
        accountUsername: page.name,
        profilePicture: page.picture?.data?.url,
        pageAccessToken: page.access_token,
        platformData: {
          pages: pages.map(p => ({
            id: p.id,
            name: p.name,
            accessToken: p.access_token
          }))
        }
      };
    } catch (error) {
      throw new Error(`Failed to get Facebook account info: ${error.response?.data?.error?.message || error.message}`);
    }
  }


  async validateToken(accessToken) {
    try {
      await axios.get(`${this.apiBase}/me`, {
        params: { access_token: accessToken }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async disconnect(accessToken) {
    try {
      await axios.delete(`${this.apiBase}/me/permissions`, {
        params: { access_token: accessToken }
      });
      return true;
    } catch (error) {
      return true; 
    }
  }
}

module.exports = FacebookService;

