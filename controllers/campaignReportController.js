const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const Campaign = require('../models/Campaign');
const KPI = require('../models/KPI');
const TargetAudience = require('../models/TargetAudience');
const ContentCalendar = require('../models/ContentCalendar');
const PostAnalytics = require('../models/PostAnalytics');
const { Op } = require('sequelize');

/**
 * Campaign Report Controller
 * Generates PDF reports for completed campaigns
 */

// @desc    Generate PDF report for a completed campaign
// @route   GET /api/campaigns/:id/report
// @access  Private (Owner only)
exports.generateCampaignReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ownerId = req.user?.id;

    // Fetch campaign with all related data
    const campaign = await Campaign.findOne({
      where: { id, userId: ownerId },
      include: [
        {
          model: KPI,
          as: 'kpis',
          attributes: ['id', 'metric', 'targetValue'],
          required: false
        },
        {
          model: TargetAudience,
          as: 'targetAudience',
          attributes: ['id', 'ageRange', 'gender', 'interests', 'platformsUsed'],
          required: false
        },
        {
          model: ContentCalendar,
          as: 'contentCalendar',
          attributes: ['id', 'day', 'date', 'platform', 'contentType', 'status', 'task'],
          required: false
        }
      ]
    });

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    // Check if campaign is completed
    if (campaign.lifecycleStage !== 'completed') {
      return res.status(400).json({ 
        success: false, 
        message: 'Report is only available for completed campaigns' 
      });
    }

    // Calculate completion metrics
    const calendarItems = campaign.contentCalendar || [];
    const postedItems = calendarItems.filter(cc => cc.status === 'posted');
    
    // Note: PostAnalytics requires a link between ContentCalendar and Posted content
    // This would need a database schema update to add scheduledPostId to ContentCalendar
    // For now, we'll skip detailed analytics in the PDF report
    const analytics = [];
    const postedCount = calendarItems.filter(item => item.status === 'posted').length;
    const scheduledCount = calendarItems.filter(item => item.status === 'scheduled').length;
    const failedCount = calendarItems.filter(item => item.status === 'failed').length;
    const totalItems = calendarItems.length;
    const completionRate = totalItems > 0 ? Math.round((postedCount / totalItems) * 100) : 0;

    // Calculate actual performance
    let totalLikes = 0, totalComments = 0, totalShares = 0, totalReach = 0, totalImpressions = 0;
    analytics.forEach(a => {
      totalLikes += a.likes || 0;
      totalComments += a.comments || 0;
      totalShares += a.shares || 0;
      totalReach += a.reach || 0;
      totalImpressions += a.impressions || 0;
    });

    const avgEngagementRate = totalImpressions > 0 
      ? ((totalLikes + totalComments + totalShares) / totalImpressions * 100).toFixed(2)
      : 0;

    // Calculate duration
    const startDate = new Date(campaign.startDate);
    const endDate = new Date(campaign.endDate);
    const durationDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

    // Generate PDF
    const doc = new PDFDocument({ margin: 50 });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=campaign-report-${campaign.id}.pdf`);
    
    // Pipe PDF to response
    doc.pipe(res);

    // PDF Content Generation
    generatePDFContent(doc, {
      campaign,
      completionMetrics: {
        postedCount,
        scheduledCount,
        failedCount,
        totalItems,
        completionRate,
        durationDays
      },
      performanceMetrics: {
        totalLikes,
        totalComments,
        totalShares,
        totalReach,
        totalImpressions,
        avgEngagementRate,
        postsWithAnalytics: analytics.length
      },
      analytics,
      postedItems
    });

    doc.end();

  } catch (error) {
    next(error);
  }
};

// @desc    Generate bulk PDF report for all completed campaigns
// @route   GET /api/campaigns/reports/completed
// @access  Private (Owner only)
exports.generateBulkReport = async (req, res, next) => {
  try {
    const ownerId = req.user?.id;

    // Fetch all completed campaigns
    const campaigns = await Campaign.findAll({
      where: { 
        userId: ownerId,
        lifecycleStage: 'completed'
      },
      include: [
        {
          model: KPI,
          as: 'kpis',
          attributes: ['id', 'metric', 'targetValue'],
          required: false
        },
        {
          model: ContentCalendar,
          as: 'contentCalendar',
          attributes: ['id', 'status'],
          required: false
        }
      ],
      order: [['endDate', 'DESC']]
    });

    if (campaigns.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No completed campaigns found' 
      });
    }

    // Generate bulk report PDF
    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=all-campaigns-report.pdf');
    
    doc.pipe(res);

    // Title Page
    doc.fontSize(24).font('Helvetica-Bold').text('Campaign Performance Report', 50, 50);
    doc.fontSize(14).font('Helvetica').text(`Generated: ${new Date().toLocaleDateString()}`, 50, 80);
    doc.moveDown(2);

    // Summary Statistics
    doc.fontSize(16).font('Helvetica-Bold').text('Executive Summary', 50, 120);
    doc.moveDown(1);

    let totalBudget = 0;
    let totalContent = 0;
    let totalPosted = 0;

    campaigns.forEach(c => {
      totalBudget += parseFloat(c.budget_amount || 0);
      const content = c.contentCalendar || [];
      totalContent += content.length;
      totalPosted += content.filter(item => item.status === 'posted').length;
    });

    const avgDuration = Math.round(
      campaigns.reduce((sum, c) => {
        const start = new Date(c.startDate);
        const end = new Date(c.endDate);
        return sum + Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      }, 0) / campaigns.length
    );

    doc.fontSize(12).font('Helvetica');
    doc.text(`Total Campaigns: ${campaigns.length}`, 50, doc.y);
    doc.text(`Total Budget: $${totalBudget.toLocaleString()}`, 50, doc.y + 15);
    doc.text(`Total Content Pieces: ${totalContent}`, 50, doc.y + 15);
    doc.text(`Successful Posts: ${totalPosted}`, 50, doc.y + 15);
    doc.text(`Average Duration: ${avgDuration} days`, 50, doc.y + 15);
    doc.text(`Overall Completion Rate: ${totalContent > 0 ? Math.round((totalPosted / totalContent) * 100) : 0}%`, 50, doc.y + 15);

    doc.addPage();

    // Individual Campaign Summaries
    doc.fontSize(18).font('Helvetica-Bold').text('Campaign Details', 50, 50);
    doc.moveDown(1);

    campaigns.forEach((campaign, index) => {
      const content = campaign.contentCalendar || [];
      const posted = content.filter(item => item.status === 'posted').length;
      const completionRate = content.length > 0 ? Math.round((posted / content.length) * 100) : 0;

      doc.fontSize(14).font('Helvetica-Bold').text(`${index + 1}. ${campaign.campaignName}`, 50, doc.y + 10);
      doc.fontSize(10).font('Helvetica');
      doc.text(`   Goal: ${campaign.campaign_goal}`, 50, doc.y + 5);
      doc.text(`   Budget: $${parseFloat(campaign.budget_amount || 0).toLocaleString()}`, 50, doc.y + 12);
      doc.text(`   Duration: ${new Date(campaign.startDate).toLocaleDateString()} - ${new Date(campaign.endDate).toLocaleDateString()}`, 50, doc.y + 12);
      doc.text(`   Content: ${posted}/${content.length} posted (${completionRate}% completion)`, 50, doc.y + 12);
      doc.text(`   KPIs: ${campaign.kpis?.map(k => k.metric).join(', ') || 'None'}`, 50, doc.y + 12);
      
      doc.moveDown(1);

      // Add page break if needed
      if (doc.y > 700 && index < campaigns.length - 1) {
        doc.addPage();
      }
    });

    doc.end();

  } catch (error) {
    next(error);
  }
};

/**
 * Generate PDF content for single campaign report
 */
function generatePDFContent(doc, data) {
  const { campaign, completionMetrics, performanceMetrics, analytics, postedItems } = data;
  
  // Header Section
  doc.fontSize(24).font('Helvetica-Bold').text('Campaign Completion Report', 50, 50);
  doc.moveDown(0.5);
  
  doc.fontSize(14).font('Helvetica').text(`Campaign: ${campaign.campaignName}`, 50, doc.y);
  doc.fontSize(10).text(`Generated: ${new Date().toLocaleDateString()}`, 50, doc.y + 15);
  doc.moveDown(2);

  // Campaign Overview Box
  doc.rect(50, doc.y, 500, 80).stroke('#745CB4');
  doc.fontSize(12).font('Helvetica-Bold').text('Campaign Overview', 60, doc.y + 10);
  doc.fontSize(10).font('Helvetica');
  doc.text(`Goal: ${campaign.campaign_goal}`, 60, doc.y + 5);
  doc.text(`Budget: $${parseFloat(campaign.budget_amount || 0).toLocaleString()} ${campaign.budget_currency}`, 60, doc.y + 15);
  doc.text(`Duration: ${completionMetrics.durationDays} days (${new Date(campaign.startDate).toLocaleDateString()} - ${new Date(campaign.endDate).toLocaleDateString()})`, 60, doc.y + 15);
  doc.text(`Status: ${campaign.lifecycleStage.toUpperCase()}`, 60, doc.y + 15);
  doc.moveDown(3);

  // Completion Metrics Section
  doc.fontSize(16).font('Helvetica-Bold').text('Completion Metrics', 50, doc.y);
  doc.moveDown(0.5);
  
  doc.fontSize(12).font('Helvetica-Bold').text('Content Delivery', 50, doc.y);
  doc.fontSize(10).font('Helvetica');
  doc.text(`Total Content Pieces: ${completionMetrics.totalItems}`, 50, doc.y + 15);
  doc.text(`Successfully Posted: ${completionMetrics.postedCount}`, 50, doc.y + 15);
  doc.text(`Scheduled but Not Posted: ${completionMetrics.scheduledCount}`, 50, doc.y + 15);
  doc.text(`Failed: ${completionMetrics.failedCount}`, 50, doc.y + 15);
  doc.text(`Completion Rate: ${completionMetrics.completionRate}%`, 50, doc.y + 15);
  doc.moveDown(1);

  // Performance Metrics Section (if available)
  if (performanceMetrics.postsWithAnalytics > 0) {
    doc.fontSize(16).font('Helvetica-Bold').text('Performance Metrics', 50, doc.y);
    doc.moveDown(0.5);
    
    doc.fontSize(12).font('Helvetica-Bold').text('Engagement Summary', 50, doc.y);
    doc.fontSize(10).font('Helvetica');
    doc.text(`Total Likes: ${performanceMetrics.totalLikes.toLocaleString()}`, 50, doc.y + 15);
    doc.text(`Total Comments: ${performanceMetrics.totalComments.toLocaleString()}`, 50, doc.y + 15);
    doc.text(`Total Shares: ${performanceMetrics.totalShares.toLocaleString()}`, 50, doc.y + 15);
    doc.text(`Total Reach: ${performanceMetrics.totalReach.toLocaleString()}`, 50, doc.y + 15);
    doc.text(`Total Impressions: ${performanceMetrics.totalImpressions.toLocaleString()}`, 50, doc.y + 15);
    doc.text(`Average Engagement Rate: ${performanceMetrics.avgEngagementRate}%`, 50, doc.y + 15);
    doc.text(`Posts with Analytics: ${performanceMetrics.postsWithAnalytics}`, 50, doc.y + 15);
    doc.moveDown(1);
  }

  // Target Audience Section
  if (campaign.targetAudience) {
    doc.fontSize(16).font('Helvetica-Bold').text('Target Audience', 50, doc.y);
    doc.moveDown(0.5);
    
    doc.fontSize(10).font('Helvetica');
    doc.text(`Age Range: ${campaign.targetAudience.ageRange}`, 50, doc.y);
    doc.text(`Gender: ${campaign.targetAudience.gender}`, 50, doc.y + 15);
    doc.text(`Interests: ${campaign.targetAudience.interests?.join(', ') || 'N/A'}`, 50, doc.y + 15);
    doc.text(`Platforms: ${campaign.targetAudience.platformsUsed?.join(', ') || 'N/A'}`, 50, doc.y + 15);
    doc.moveDown(1);
  }

  // KPIs Section
  if (campaign.kpis && campaign.kpis.length > 0) {
    doc.fontSize(16).font('Helvetica-Bold').text('Key Performance Indicators', 50, doc.y);
    doc.moveDown(0.5);
    
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Metric', 50, doc.y);
    doc.text('Target', 200, doc.y);
    doc.moveDown(0.3);
    
    doc.fontSize(10).font('Helvetica');
    campaign.kpis.forEach(kpi => {
      doc.text(kpi.metric.replace('_', ' ').toUpperCase(), 50, doc.y + 12);
      doc.text(kpi.targetValue, 200, doc.y);
    });
    doc.moveDown(1);
  }

  // Content Calendar Summary
  if (postedItems.length > 0) {
    doc.addPage();
    doc.fontSize(16).font('Helvetica-Bold').text('Published Content Summary', 50, 50);
    doc.moveDown(0.5);
    
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Platform', 50, doc.y);
    doc.text('Type', 150, doc.y);
    doc.text('Date', 250, doc.y);
    doc.moveDown(0.3);
    
    doc.fontSize(9).font('Helvetica');
    postedItems.forEach((item, index) => {
      const y = doc.y + 12;
      if (y > 750) {
        doc.addPage();
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Platform', 50, 50);
        doc.text('Type', 150, 50);
        doc.text('Date', 250, 50);
        doc.fontSize(9).font('Helvetica');
      }
      
      doc.text(item.platform, 50, doc.y + 12);
      doc.text(item.contentType, 150, doc.y);
      doc.text(new Date(item.date).toLocaleDateString(), 250, doc.y);
    });
  }

  // Footer
  doc.fontSize(8).font('Helvetica').text(
    'Generated by Influencer Platform Campaign Management System',
    50,
    780,
    { align: 'center' }
  );
}
