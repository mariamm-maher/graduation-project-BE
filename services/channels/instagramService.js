const BasePlatformService = require('./basePlatformService');
const axios = require('axios');


class InstagramService extends BasePlatformService {
  constructor() {
    super('instagram');
    this.facebookApiBase = 'https://graph.facebook.com/v18.0';
    this.clientId = process.env.FACEBOOK_APP_ID;
    this.clientSecret = process.env.FACEBOOK_APP_SECRET;
  }

  getAuthorizationUrl(redirectUri, state) {
    const scopes = [
      'instagram_basic',
      'instagram_content_publish',
      'pages_read_engagement',
      'pages_show_list',
      'business_management'
    ].join(',');

    return `${this.facebookApiBase}/oauth/authorize?` +
      `client_id=${this.clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${scopes}&` +
      `state=${state}&` +
      `response_type=code`;
  }

  async exchangeCodeForToken(code, redirectUri) {
    try {
      const response = await axios.get(`${this.facebookApiBase}/oauth/access_token`, {
        params: {
          client_id: this.clientId,
          client_secret: this.clientSecret,
          redirect_uri: redirectUri,
          code: code
        }
      });

      const { access_token, expires_in } = response.data;

      const longLivedResponse = await axios.get(`${this.facebookApiBase}/oauth/access_token`, {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          fb_exchange_token: access_token
        }
      });

      const longLivedToken = longLivedResponse.data.access_token;
      const expiresIn = longLivedResponse.data.expires_in || expires_in;

      return {
        accessToken: longLivedToken,
        expiresIn: expiresIn,
        tokenType: 'Bearer'
      };
    } catch (error) {
      throw new Error(`Failed to exchange code for token: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async refreshToken(refreshToken) {
    throw new Error('Token refresh for Instagram is handled via Facebook Graph API');
  }

  async getAccountInfo(accessToken) {
    try {
      // First, get user's pages
      const pagesResponse = await axios.get(`${this.facebookApiBase}/me/accounts`, {
        params: {
          access_token: accessToken,
          fields: 'id,name,access_token,instagram_business_account'
        }
      });

      const pages = pagesResponse.data.data;
      if (!pages || pages.length === 0) {
        throw new Error('No Facebook pages found. Please create a Facebook Page and connect it to an Instagram Business account.');
      }

      // Find page with Instagram account
      let instagramAccount = null;
      for (const page of pages) {
        if (page.instagram_business_account) {
          const igResponse = await axios.get(
            `${this.facebookApiBase}/${page.instagram_business_account.id}`,
            {
              params: {
                access_token: page.access_token,
                fields: 'id,username,name,profile_picture_url'
              }
            }
          );
          instagramAccount = {
            accountId: igResponse.data.id,
            accountName: igResponse.data.name,
            accountUsername: igResponse.data.username,
            profilePicture: igResponse.data.profile_picture_url,
            pageId: page.id,
            pageAccessToken: page.access_token,
            platformData: {
              pageId: page.id,
              pageName: page.name
            }
          };
          break;
        }
      }

      if (!instagramAccount) {
        throw new Error('No Instagram Business account found. Please connect an Instagram account to your Facebook Page.');
      }

      return instagramAccount;
    } catch (error) {
      throw new Error(`Failed to get Instagram account info: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async validateToken(accessToken) {
    try {
      await axios.get(`${this.facebookApiBase}/me`, {
        params: { access_token: accessToken }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async disconnect(accessToken) {
    try {
      await axios.delete(`${this.facebookApiBase}/me/permissions`, {
        params: { access_token: accessToken }
      });
      return true;
    } catch (error) {
      // Token might already be invalid, consider it disconnected
      return true;
    }
  }
}

module.exports = InstagramService;

