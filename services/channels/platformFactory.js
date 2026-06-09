const InstagramService = require('./instagramService');
const FacebookService = require('./facebookService');
const TwitterService = require('./XService');
const LinkedInService = require('./linkedinService');

class PlatformFactory {
  static getService(platform) {
    const platformLower = platform.toLowerCase();
    
    switch (platformLower) {
      case 'instagram':
        return new InstagramService();
      case 'facebook':
        return new FacebookService();
      case 'tiktok':
        // TikTok API access is very limited - would need special approval
        throw new Error('TikTok integration requires special API access approval');
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  static getSupportedPlatforms() {
    return ['instagram', 'facebook'];
  }
}

module.exports = PlatformFactory;

