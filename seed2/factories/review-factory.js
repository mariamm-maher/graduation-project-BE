/**
 * Review Factory
 * 
 * Generates realistic Review seed data.
 */

const { pick } = require('../data/names');
const { Validators } = require('../utils/validators');

class ReviewFactory {
  constructor() {
    this.reviewTemplates = {
      positive: [
        'Outstanding collaboration! Professional, creative, and delivered exactly what we needed.',
        'Exceptional work quality and communication throughout the project.',
        'Exceeded our expectations! The content was authentic and resonated perfectly with our audience.',
        'Highly professional and responsive. Would definitely collaborate again.',
        'Amazing results! The campaign performance was beyond our projections.',
        'Creative approach and excellent execution. A pleasure to work with.',
        'Delivered high-quality content on time and within budget.',
        'Great engagement rates and authentic brand representation.',
        'Professional, reliable, and incredibly talented. Highly recommended!',
        'The content perfectly captured our brand voice and message.'
      ],
      neutral: [
        'Good collaboration overall. Some minor delays but quality was satisfactory.',
        'Met our basic requirements. Communication could have been more proactive.',
        'Decent results. Content was good but engagement was average.',
        'Acceptable work. Met deadlines but lacked some creative flair.',
        'Solid performance. Would consider working together again with clearer briefs.',
        'Average experience. Some aspects were great, others need improvement.',
        'Met expectations but did not exceed them. Professional throughout.',
        'Good content but delivery timeline was a bit tight.'
      ],
      negative: [
        'Disappointing experience. Deadlines were missed and communication was poor.',
        'Content did not align with our brand guidelines despite multiple revisions.',
        'Low engagement rates and content seemed inauthentic to the audience.',
        'Unprofessional behavior and unresponsive to feedback.',
        'Not satisfied with the quality. Will not collaborate again.',
        'Overpromised and underdelivered. Expected much better results.'
      ]
    };

    this.influencerReviewTemplates = {
      positive: [
        'Amazing brand to work with! Clear brief, fair compensation, and great creative freedom.',
        'Professional team and smooth collaboration process. Highly recommend!',
        'One of my favorite brand partnerships. They truly value creator input.',
        'Fair pay, clear expectations, and timely communication. Perfect!',
        'Great brand alignment and respectful partnership. Would love to work together again.',
        'Excellent experience from start to finish. Brand really understands influencer marketing.'
      ],
      neutral: [
        'Decent brand partnership. Brief could have been clearer but overall okay.',
        'Good collaboration. Payment was on time but approval process was slow.',
        'Acceptable experience. Some miscommunication but resolved eventually.',
        'Okay to work with. Nothing exceptional but no major issues either.'
      ],
      negative: [
        'Difficult approval process with excessive revision requests.',
        'Payment was delayed and communication was inconsistent.',
        'Brief was unclear and expectations kept changing throughout the project.',
        'Would not recommend. Did not respect agreed terms.'
      ]
    };
  }

  /**
   * Generate a review
   * @param {number} ownerId 
   * @param {number} influencerId 
   * @param {number} collaborationId 
   * @param {object} options
   * @returns {object}
   */
  generateReview(ownerId, influencerId, collaborationId, options = {}) {
    const {
      rating = this.generateRating(),
      reviewerRole = 'owner' // 'owner' or 'influencer'
    } = options;

    const review = {
      ownerId,
      influencerId,
      collaborationId,
      rating,
      reviewText: this.generateReviewText(rating, reviewerRole)
    };

    // Validate
    const errors = Validators.validateReview(review);
    Validators.assertValid('Review', review, errors);

    return review;
  }

  /**
   * Generate a rating (weighted toward positive)
   * @returns {number}
   */
  generateRating() {
    const rand = Math.random();
    // 60% chance of 5 stars, 20% of 4 stars, 10% of 3 stars, 7% of 2 stars, 3% of 1 star
    if (rand < 0.60) return 5;
    if (rand < 0.80) return 4;
    if (rand < 0.90) return 3;
    if (rand < 0.97) return 2;
    return 1;
  }

  /**
   * Generate review text based on rating and reviewer
   * @param {number} rating 
   * @param {string} reviewerRole 
   * @returns {string}
   */
  generateReviewText(rating, reviewerRole) {
    const templates = reviewerRole === 'owner' 
      ? this.reviewTemplates 
      : this.influencerReviewTemplates;

    let sentiment;
    if (rating >= 4) sentiment = 'positive';
    else if (rating === 3) sentiment = 'neutral';
    else sentiment = 'negative';

    return pick(templates[sentiment]);
  }

  /**
   * Generate owner reviewing influencer
   * @param {number} ownerId 
   * @param {number} influencerId 
   * @param {number} collaborationId 
   * @param {object} options
   * @returns {object}
   */
  generateOwnerReview(ownerId, influencerId, collaborationId, options = {}) {
    return this.generateReview(ownerId, influencerId, collaborationId, {
      reviewerRole: 'owner',
      ...options
    });
  }

  /**
   * Generate influencer reviewing owner/brand
   * @param {number} ownerId 
   * @param {number} influencerId 
   * @param {number} collaborationId 
   * @param {object} options
   * @returns {object}
   */
  generateInfluencerReview(ownerId, influencerId, collaborationId, options = {}) {
    return this.generateReview(ownerId, influencerId, collaborationId, {
      reviewerRole: 'influencer',
      ...options
    });
  }

  /**
   * Generate complete review exchange for a collaboration
   * @param {number} ownerId 
   * @param {number} influencerId 
   * @param {number} collaborationId 
   * @param {object} options
   * @returns {Array}
   */
  generateReviewExchange(ownerId, influencerId, collaborationId, options = {}) {
    const reviews = [];

    // Owner reviews influencer
    reviews.push(this.generateOwnerReview(ownerId, influencerId, collaborationId, options));

    // Influencer reviews owner/brand (30% of collaborations)
    if (Math.random() > 0.7) {
      reviews.push(this.generateInfluencerReview(ownerId, influencerId, collaborationId, options));
    }

    return reviews;
  }

  /**
   * Generate reviews for multiple completed collaborations
   * @param {Array} collaborations - Array of completed collaboration objects
   * @param {Array} owners 
   * @param {Array} influencers 
   * @returns {Array}
   */
  generateReviewsForCollaborations(collaborations, owners, influencers) {
    const reviews = [];

    for (const collab of collaborations) {
      if (collab.status !== 'completed') continue;

      const owner = owners.find(o => o.id === collab.ownerId);
      const influencer = influencers.find(i => i.id === collab.influencerId);

      if (!owner || !influencer) continue;

      const exchange = this.generateReviewExchange(
        owner.id,
        influencer.id,
        collab.id
      );

      reviews.push(...exchange);
    }

    return reviews;
  }
}

module.exports = new ReviewFactory();
