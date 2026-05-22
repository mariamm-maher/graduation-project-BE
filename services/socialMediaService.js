const api = require('../config/axios');

const SOCIAL_ENDPOINTS = {
  accounts: '/channels',
  disconnect: (id) => `/channels/${id}`,
  details: (id) => `/channels/${id}`,
  refreshToken: (id) => `/channels/${id}/refresh-token`,
  stats: (id) => `/analytics/channels/${id}`,
};

const socialMediaService = {
  getAccounts: async () => {
    try {
      const response = await api.get(SOCIAL_ENDPOINTS.accounts);
      return response.data;
    } catch (error) {
      console.error('Get accounts error:', error);
      throw error;
    }
  },

  getStats: async (channelId) => {
    try {
      const response = await api.get(SOCIAL_ENDPOINTS.stats(channelId));
      return response.data;
    } catch (error) {
      console.error('Get stats error:', error);
      throw error;
    }
  },

  disconnectAccount: async (channelId) => {
    try {
      const response = await api.delete(SOCIAL_ENDPOINTS.disconnect(channelId));
      return response.data;
    } catch (error) {
      console.error('Disconnect error:', error);
      throw error;
    }
  },

  createPost: async (payload) => {
    try {
      const response = await api.post('/posts', payload);
      return response.data;
    } catch (error) {
      console.error('Create post error:', error);
      throw error;
    }
  },

  getPosts: async () => {
    try {
      const response = await api.get('/posts');
      return response.data;
    } catch (error) {
      console.error('Get posts error:', error);
      throw error;
    }
  },

  deletePost: async (postId) => {
    try {
      const response = await api.delete(`/posts/${postId}`);
      return response.data;
    } catch (error) {
      console.error('Delete post error:', error);
      throw error;
    }
  },

  getPostAnalytics: async (postId) => {
    try {
      const response = await api.get(`/posts/${postId}/analytics`);
      return response.data;
    } catch (error) {
      console.error('Get post analytics error:', error);
      throw error;
    }
  },
};

module.exports = socialMediaService;
