
class BasePlatformService {
  constructor(platform) {
    this.platform = platform;
  }

  /**
   * Get OAuth authorization URL
   * @param {string} redirectUri - Callback URL after authorization
   * @param {string} state - State parameter for security
   * @returns {string} Authorization URL
   */
  getAuthorizationUrl(redirectUri, state) {
    throw new Error('getAuthorizationUrl must be implemented by platform service');
  }

  /**
   * Exchange authorization code for access token
   * @param {string} code - Authorization code from OAuth callback
   * @param {string} redirectUri - Callback URL used in authorization
   * @returns {Object} Token data (accessToken, refreshToken, expiresIn, etc.)
   */
  async exchangeCodeForToken(code, redirectUri) {
    throw new Error('exchangeCodeForToken must be implemented by platform service');
  }

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Object} New token data
   */
  async refreshToken(refreshToken) {
    throw new Error('refreshToken must be implemented by platform service');
  }

  /**
   * Get account information
   * @param {string} accessToken - Access token
   * @returns {Object} Account information
   */
  async getAccountInfo(accessToken) {
    throw new Error('getAccountInfo must be implemented by platform service');
  }

  /**
   * Publish a post
   * @param {string} accessToken - Access token
   * @param {Object} postData - Post data (content, media, etc.)
   * @returns {Object} Published post information
   */
  async publishPost(accessToken, postData) {
    throw new Error('publishPost must be implemented by platform service');
  }

  /**
   * Validate access token
   * @param {string} accessToken - Access token to validate
   * @returns {boolean} True if token is valid
   */
  async validateToken(accessToken) {
    throw new Error('validateToken must be implemented by platform service');
  }

  /**
   * Disconnect account (revoke token)
   * @param {string} accessToken - Access token to revoke
   * @returns {boolean} True if successful
   */
  async disconnect(accessToken) {
    throw new Error('disconnect must be implemented by platform service');
  }
}

module.exports = BasePlatformService;

