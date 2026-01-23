const { Chat, Message, User, InfluencerProfile } = require('../models');
const { Op } = require('sequelize');
const AppError = require('../utils/AppError');
const sendSuccess = require('../utils/sendSuccess');

// @desc    Start or get a chat conversation with an influencer
// @route   POST /api/chat/start

exports.startChat = async (req, res, next) => {
  try {
    // Accept userId from request body (the userId of the user with INFLUENCER role)
    const { userId: otherUserId, campaignId } = req.body;
    const userId = req.user.id;

  
    if (!otherUserId) {
      return next(new AppError('User ID is required', 400));
    }

    // Check if user is trying to chat with themselves
    if (userId === otherUserId) {
      return next(new AppError('You cannot chat with yourself', 400));
    }

    // Check if the other user exists
    const otherUser = await User.findByPk(otherUserId);
    if (!otherUser) {
      return next(new AppError('User not found', 404));
    }

    // Check if chat already exists
    const existingChat = await Chat.findOne({
      where: {
        userId,
        otherUserId: otherUserId,
        campaignId: campaignId || null
      }
    });

    if (existingChat) {
      // Return existing chat
      const chat = await Chat.findByPk(existingChat.id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email']
          },
          {
            model: User,
            as: 'otherUser',
            attributes: ['id', 'firstName', 'lastName', 'email']
          }
        ]
      });

      return sendSuccess(res, 200, 'Chat retrieved successfully', { chat });
    }

    // Create new chat
    const chat = await Chat.create({
      userId,
      otherUserId: otherUserId,
      campaignId: campaignId || null
    });

   
    const chatWithDetails = await Chat.findByPk(chat.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: User,
          as: 'otherUser',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    sendSuccess(res, 201, 'Chat started successfully', { chat: chatWithDetails });
  } catch (error) {
    next(error);
  }
};

// @desc    Send a message in a chat
// @route   POST /api/chat/:chatId/messages
// @access  Private
exports.sendMessage = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

  
    if (!content || content.trim().length === 0) {
      return next(new AppError('Message content is required', 400));
    }

   
    const chat = await Chat.findByPk(chatId);
    if (!chat) {
      return next(new AppError('Chat not found', 404));
    }

  
    if (chat.userId !== userId && chat.otherUserId !== userId) {
      return next(new AppError('You are not authorized to send messages in this chat', 403));
    }

    // Create message
    const message = await Message.create({
      chatId,
      senderId: userId,
      content: content.trim()
    });

    // Update chat's lastMessageAt
    await chat.update({
      lastMessageAt: new Date()
    });

  
    const messageWithSender = await Message.findByPk(message.id, {
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    sendSuccess(res, 201, 'Message sent successfully', { message: messageWithSender });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all chats for the current user
// @route   GET /api/chat
// @access  Private
exports.getChats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get all chats where user is either the owner or influencer
    const chats = await Chat.findAll({
      where: {
        [Op.or]: [
          { userId },
          { otherUserId: userId }
        ],
        isActive: true
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: User,
          as: 'otherUser',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: Message,
          as: 'messages',
          limit: 1,
          order: [['createdAt', 'DESC']],
          include: [
            {
              model: User,
              as: 'sender',
              attributes: ['id', 'firstName', 'lastName']
            }
          ]
        }
      ],
      order: [['lastMessageAt', 'DESC NULLS LAST'], ['createdAt', 'DESC']]
    });

    sendSuccess(res, 200, 'Chats retrieved successfully', { chats });
  } catch (error) {
    next(error);
  }
};

// @desc    Get messages for a specific chat
// @route   GET /api/chat/:chatId/messages
// @access  Private
exports.getMessages = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    // Check if chat exists and user is part of it
    const chat = await Chat.findByPk(chatId);
    if (!chat) {
      return next(new AppError('Chat not found', 404));
    }

   
    if (chat.userId !== userId && chat.otherUserId !== userId) {
      return next(new AppError('You are not authorized to view this chat', 403));
    }

    // Get messages
    const messages = await Message.findAndCountAll({
      where: { chatId },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    // Mark messages as read if they are not sent by the current user
    await Message.update(
      {
        isRead: true,
        readAt: new Date()
      },
      {
        where: {
          chatId,
          senderId: { [Op.ne]: userId },
          isRead: false
        }
      }
    );

    sendSuccess(res, 200, 'Messages retrieved successfully', {
      messages: messages.rows.reverse(), // Reverse to show oldest first
      pagination: {
        page,
        limit,
        total: messages.count,
        totalPages: Math.ceil(messages.count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a chat by influencer name
// @route   GET /api/chat/influencer/:influencerName
// @access  Private
exports.getChatByInfluencerName = async (req, res, next) => {
  try {
    const { influencerName } = req.params;
    const userId = req.user.id;

    if (!influencerName) {
      return next(new AppError('Influencer name is required', 400));
    }

    // Split the name to handle both firstName and lastName
    const nameParts = influencerName.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null;

    // Build search conditions
    const whereConditions = {
      [Op.or]: [
        { firstName: { [Op.iLike]: `%${firstName}%` } }
      ]
    };

    if (lastName) {
      whereConditions[Op.or].push({ lastName: { [Op.iLike]: `%${lastName}%` } });
      // Also search for full name match
      whereConditions[Op.or].push({
        [Op.and]: [
          { firstName: { [Op.iLike]: `%${firstName}%` } },
          { lastName: { [Op.iLike]: `%${lastName}%` } }
        ]
      });
    }

    // Find influencer by name
    const influencer = await User.findOne({
      where: whereConditions,
      include: [
        {
          model: InfluencerProfile,
          as: 'influencerProfile',
          required: true // Only get users who are influencers
        }
      ]
    });

    if (!influencer) {
      return next(new AppError('Influencer not found', 404));
    }

    // Find chat between current user and this influencer
    const chat = await Chat.findOne({
      where: {
        userId,
        otherUserId: influencer.id,
        isActive: true
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: User,
          as: 'otherUser',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: Message,
          as: 'messages',
          limit: 1,
          order: [['createdAt', 'DESC']],
          include: [
            {
              model: User,
              as: 'sender',
              attributes: ['id', 'firstName', 'lastName']
            }
          ]
        }
      ],
      order: [['lastMessageAt', 'DESC NULLS LAST'], ['createdAt', 'DESC']]
    });

    if (!chat) {
      return next(new AppError('No chat found with this influencer', 404));
    }

    sendSuccess(res, 200, 'Chat retrieved successfully', { 
      chat,
      influencer: {
        id: influencer.id,
        firstName: influencer.firstName,
        lastName: influencer.lastName,
        email: influencer.email
      }
    });
  } catch (error) {
    next(error);
  }
};

