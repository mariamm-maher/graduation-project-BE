const { sequelize, PostAnalytics, KPI } = require('./models');

async function removeSeededData() {
  try {
    console.log('Starting removal of seeded dashboard data...');

    await sequelize.authenticate();
    console.log('Database connected.');

    // Delete all PostAnalytics records
    const analyticsDeleted = await PostAnalytics.destroy({
      where: {},
      truncate: true
    });

    console.log(`Deleted ${analyticsDeleted} PostAnalytics records.`);

    // Delete all KPI records
    const kpisDeleted = await KPI.destroy({
      where: {},
      truncate: true
    });

    console.log(`Deleted ${kpisDeleted} KPI records.`);

    console.log('Seeded dashboard data removed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error removing seeded data:', error);
    process.exit(1);
  }
}

removeSeededData();
