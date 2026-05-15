/**
 * ID Tracker Utility
 * 
 * Maps seed keys to actual database IDs during seeding.
 * Essential for maintaining foreign key relationships.
 */

class IdTracker {
  constructor() {
    this.ids = new Map();
    this.sequences = new Map();
  }

  /**
   * Store an ID for a given entity type and key
   * @param {string} entityType - e.g., 'User', 'Campaign', 'Collaboration'
   * @param {string|number} key - The seed key (e.g., 'owner_01', 'campaign_summer_2026')
   * @param {number} id - The actual database ID
   */
  set(entityType, key, id) {
    if (!this.ids.has(entityType)) {
      this.ids.set(entityType, new Map());
    }
    this.ids.get(entityType).set(key, id);
  }

  /**
   * Retrieve an ID by entity type and key
   * @param {string} entityType 
   * @param {string|number} key 
   * @returns {number|undefined}
   */
  get(entityType, key) {
    return this.ids.get(entityType)?.get(key);
  }

  /**
   * Get all IDs for an entity type
   * @param {string} entityType 
   * @returns {number[]}
   */
  getAll(entityType) {
    const typeMap = this.ids.get(entityType);
    if (!typeMap) return [];
    return Array.from(typeMap.values());
  }

  /**
   * Get all keys for an entity type
   * @param {string} entityType 
   * @returns {string[]}
   */
  getKeys(entityType) {
    const typeMap = this.ids.get(entityType);
    if (!typeMap) return [];
    return Array.from(typeMap.keys());
  }

  /**
   * Check if an ID exists
   * @param {string} entityType 
   * @param {string|number} key 
   * @returns {boolean}
   */
  has(entityType, key) {
    return this.ids.get(entityType)?.has(key) || false;
  }

  /**
   * Get a random ID from an entity type
   * @param {string} entityType 
   * @returns {number|undefined}
   */
  getRandom(entityType) {
    const ids = this.getAll(entityType);
    if (ids.length === 0) return undefined;
    return ids[Math.floor(Math.random() * ids.length)];
  }

  /**
   * Get multiple random IDs from an entity type
   * @param {string} entityType 
   * @param {number} count 
   * @returns {number[]}
   */
  getRandomMultiple(entityType, count) {
    const ids = this.getAll(entityType);
    if (ids.length === 0) return [];
    const shuffled = [...ids].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, ids.length));
  }

  /**
   * Get ID at specific index
   * @param {string} entityType 
   * @param {number} index 
   * @returns {number|undefined}
   */
  getAtIndex(entityType, index) {
    const ids = this.getAll(entityType);
    return ids[index];
  }

  /**
   * Clear all tracked IDs
   */
  clear() {
    this.ids.clear();
    this.sequences.clear();
  }

  /**
   * Generate a sequential key for an entity type
   * @param {string} entityType 
   * @returns {string}
   */
  nextKey(entityType) {
    const current = this.sequences.get(entityType) || 0;
    const next = current + 1;
    this.sequences.set(entityType, next);
    return `${entityType.toLowerCase()}_${String(next).padStart(3, '0')}`;
  }

  /**
   * Debug: Print all tracked IDs
   */
  debug() {
    console.log('\n=== ID TRACKER STATE ===');
    for (const [entityType, keyMap] of this.ids) {
      console.log(`\n${entityType}:`);
      for (const [key, id] of keyMap) {
        console.log(`  ${key} => ${id}`);
      }
    }
    console.log('========================\n');
  }
}

module.exports = new IdTracker();
