const BasePlatformService = require('./basePlatformService');
const axios = require('axios');

class TikTokService extends BasePlatformService {
  constructor() {
    super('tiktok');
    this.apiBase = 'https://api.tiktok.com/v1';
    this.clientId = process.env.TIKTOK_CLIENT_KEY;
    this.clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  }
}

module.exports = TikTokService; 
