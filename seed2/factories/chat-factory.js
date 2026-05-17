/**
 * Chat Factory
 * 
 * Generates realistic ChatRoom, ChatParticipant, and Message seed data.
 */

const { pick } = require('../data/names');
const { CHAT_MESSAGES } = require('../data/constants');
const { Validators } = require('../utils/validators');

class ChatFactory {
  /**
   * Generate a ChatRoom
   * @param {number} collaborationId - Optional, can be null
   * @param {object} options
   * @returns {object}
   */
  generateChatRoom(collaborationId = null, options = {}) {
    const { type = 'one_to_one' } = options;

    return {
      collaborationId,
      type,
      name: type === 'group' ? options.name || 'Project Discussion' : null
    };
  }

  /**
   * Generate ChatParticipants
   * @param {number} chatRoomId 
   * @param {number} ownerId 
   * @param {number} influencerId 
   * @param {Date} joinedAt 
   * @returns {Array}
   */
  generateParticipants(chatRoomId, ownerId, influencerId, joinedAt = new Date()) {
    return [
      {
        chatRoomId,
        userId: ownerId,
        role: 'owner',
        joinedAt
      },
      {
        chatRoomId,
        userId: influencerId,
        role: 'influencer',
        joinedAt
      }
    ];
  }

  /**
   * Generate Messages for a chat room
   * @param {number} chatRoomId 
   * @param {number} ownerId 
   * @param {number} influencerId 
   * @param {number} count 
   * @param {object} options
   * @returns {Array}
   */
  generateMessages(chatRoomId, ownerId, influencerId, count = 15, options = {}) {
    const messages = [];
    const now = Date.now();
    let senderRole = 'owner'; // Owner typically initiates

    for (let i = 0; i < count; i++) {
      // Alternate sender with some variation
      if (Math.random() > 0.4) {
        senderRole = senderRole === 'owner' ? 'influencer' : 'owner';
      }

      const senderId = senderRole === 'owner' ? ownerId : influencerId;
      const content = this.generateMessageContent(senderRole, i);
      
      // Spread messages over time (hours apart)
      const minutesAgo = (count - i) * 60 + Math.floor(Math.random() * 30);
      const sentAt = new Date(now - (minutesAgo * 60 * 1000));

      // First messages are read, recent might not be
      let status;
      if (i < count - 3) status = 'read';
      else if (i < count - 1) status = 'delivered';
      else status = 'sent';

      const message = {
        chatRoomId,
        senderId,
        content,
        sentAt,
        status
      };

      // Validate
      const errors = Validators.validateMessage(message);
      Validators.assertValid('Message', message, errors);

      messages.push(message);
    }

    return messages;
  }

  /**
   * Generate message content based on sender and position in conversation
   * @param {string} senderRole 
   * @param {number} position 
   * @returns {string}
   */
  generateMessageContent(senderRole, position) {
    const templates = CHAT_MESSAGES[senderRole];
    
    // Pick message based on position in conversation flow
    const index = Math.min(position, templates.length - 1);
    return templates[index] || pick(templates);
  }

  /**
   * Generate a complete chat setup for a collaboration
   * @param {number} collaborationId 
   * @param {number} ownerId 
   * @param {number} influencerId 
   * @param {object} options
   * @returns {object}
   */
  generateCompleteChat(collaborationId, ownerId, influencerId, options = {}) {
    const room = this.generateChatRoom(collaborationId, { type: 'one_to_one' });
    
    const joinedAt = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)); // Joined 30 days ago
    const participants = this.generateParticipants(null, ownerId, influencerId, joinedAt);
    
    const messageCount = options.messageCount || Math.floor(Math.random() * 20) + 10;
    const messages = this.generateMessages(null, ownerId, influencerId, messageCount);

    return {
      room,
      participants,
      messages
    };
  }

  /**
   * Generate multiple chats for collaborations
   * @param {Array} collaborations - Array of collaboration objects with ids
   * @param {Array} owners 
   * @param {Array} influencers 
   * @returns {Array}
   */
  generateChatsForCollaborations(collaborations, owners, influencers) {
    const chats = [];

    for (const collab of collaborations) {
      if (!collab.id) continue;

      const owner = owners.find(o => o.id === collab.ownerId);
      const influencer = influencers.find(i => i.id === collab.influencerId);

      if (!owner || !influencer) continue;

      chats.push({
        collaborationId: collab.id,
        ownerId: owner.id,
        influencerId: influencer.id,
        ...this.generateCompleteChat(collab.id, owner.id, influencer.id)
      });
    }

    return chats;
  }
}

module.exports = new ChatFactory();
