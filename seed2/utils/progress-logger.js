/**
 * Progress Logger Utility
 * 
 * Provides consistent, formatted logging for seed operations.
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

class ProgressLogger {
  constructor() {
    this.startTime = Date.now();
    this.stats = new Map();
  }

  /**
   * Log section header
   * @param {string} title 
   */
  section(title) {
    console.log(`\n${colors.cyan}${colors.bright}▶ ${title}${colors.reset}`);
    console.log(`${colors.dim}${'─'.repeat(50)}${colors.reset}`);
  }

  /**
   * Log success message
   * @param {string} message 
   * @param {object} details 
   */
  success(message, details = null) {
    const detailStr = details ? ` ${JSON.stringify(details)}` : '';
    console.log(`${colors.green}✓${colors.reset} ${message}${colors.dim}${detailStr}${colors.reset}`);
  }

  /**
   * Log error message
   * @param {string} message 
   * @param {Error} error 
   */
  error(message, error = null) {
    console.log(`${colors.red}✗ ${message}${colors.reset}`);
    if (error) {
      console.log(`${colors.dim}  ${error.message}${colors.reset}`);
    }
  }

  /**
   * Log warning message
   * @param {string} message 
   */
  warning(message) {
    console.log(`${colors.yellow}⚠ ${message}${colors.reset}`);
  }

  /**
   * Log info message
   * @param {string} message 
   */
  info(message) {
    console.log(`${colors.blue}ℹ ${message}${colors.reset}`);
  }

  /**
   * Log creation of an entity
   * @param {string} entityType 
   * @param {string|number} identifier 
   * @param {string} extra 
   */
  created(entityType, identifier, extra = '') {
    const extraStr = extra ? ` ${colors.dim}(${extra})${colors.reset}` : '';
    console.log(`  ${colors.green}CREATED${colors.reset} ${entityType} ${colors.bright}${identifier}${colors.reset}${extraStr}`);
  }

  /**
   * Log skipped entity (already exists)
   * @param {string} entityType 
   * @param {string|number} identifier 
   */
  skipped(entityType, identifier) {
    console.log(`  ${colors.yellow}EXISTS${colors.reset}  ${entityType} ${colors.dim}${identifier}${colors.reset}`);
  }

  /**
   * Log update of an entity
   * @param {string} entityType 
   * @param {string|number} identifier 
   */
  updated(entityType, identifier) {
    console.log(`  ${colors.blue}UPDATED${colors.reset} ${entityType} ${colors.dim}${identifier}${colors.reset}`);
  }

  /**
   * Track statistics for an entity type
   * @param {string} entityType 
   * @param {string} action - 'created', 'skipped', 'updated', 'error'
   */
  track(entityType, action) {
    if (!this.stats.has(entityType)) {
      this.stats.set(entityType, { created: 0, skipped: 0, updated: 0, error: 0 });
    }
    this.stats.get(entityType)[action]++;
  }

  /**
   * Log summary statistics
   */
  summary() {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
    
    console.log(`\n${colors.cyan}${colors.bright}${'═'.repeat(60)}${colors.reset}`);
    console.log(`${colors.cyan}${colors.bright}  SEEDING COMPLETE${colors.reset}`);
    console.log(`${colors.cyan}${colors.bright}${'═'.repeat(60)}${colors.reset}`);
    console.log(`\n${colors.dim}Duration: ${duration}s${colors.reset}\n`);

    if (this.stats.size === 0) {
      console.log('  No entities processed.');
      return;
    }

    console.log(`${colors.bright}  Entity Statistics:${colors.reset}\n`);
    
    // Find longest entity name for alignment
    const maxLength = Math.max(...Array.from(this.stats.keys()).map(k => k.length));
    
    for (const [entityType, counts] of this.stats) {
      const paddedType = entityType.padEnd(maxLength);
      const parts = [];
      if (counts.created > 0) parts.push(`${colors.green}${counts.created} created${colors.reset}`);
      if (counts.skipped > 0) parts.push(`${colors.yellow}${counts.skipped} skipped${colors.reset}`);
      if (counts.updated > 0) parts.push(`${colors.blue}${counts.updated} updated${colors.reset}`);
      if (counts.error > 0) parts.push(`${colors.red}${counts.error} errors${colors.reset}`);
      
      const total = counts.created + counts.skipped + counts.updated;
      console.log(`  ${paddedType}  ${parts.join('  ') || colors.dim + '0 processed' + colors.reset}  ${colors.dim}(total: ${total})${colors.reset}`);
    }
    
    console.log('');
  }

  /**
   * Log the start of the seeding process
   */
  start() {
    console.log(`\n${colors.cyan}${colors.bright}${'═'.repeat(60)}${colors.reset}`);
    console.log(`${colors.cyan}${colors.bright}  ENTERPRISE SEED DATA GENERATION${colors.reset}`);
    console.log(`${colors.cyan}${colors.bright}${'═'.repeat(60)}${colors.reset}\n`);
    console.log(`${colors.dim}Started: ${new Date().toISOString()}${colors.reset}\n`);
  }
}

module.exports = new ProgressLogger();
