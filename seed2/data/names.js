/**
 * Names Data
 * 
 * Realistic first names, last names, and company names for seed data.
 */

const FIRST_NAMES = {
  male: [
    'James', 'Robert', 'John', 'Michael', 'David', 'William', 'Richard', 'Joseph', 'Thomas', 'Christopher',
    'Charles', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald', 'Steven', 'Paul', 'Andrew', 'Joshua',
    'Kenneth', 'Kevin', 'Brian', 'George', 'Timothy', 'Ronald', 'Edward', 'Jason', 'Jeffrey', 'Ryan',
    'Jacob', 'Gary', 'Nicholas', 'Eric', 'Jonathan', 'Stephen', 'Larry', 'Justin', 'Scott', 'Brandon',
    'Benjamin', 'Samuel', 'Gregory', 'Frank', 'Alexander', 'Raymond', 'Patrick', 'Jack', 'Dennis', 'Jerry',
    'Oliver', 'Harry', 'George', 'Noah', 'Charlie', 'Jack', 'Leo', 'Arthur', 'Muhammad', 'Oscar',
    'Archie', 'Theo', 'Freddie', 'Theodore', 'Finley', 'Luca', 'Jacob', 'Tommy', 'Lucas', 'Roman',
    'Mohamed', 'Ibrahim', 'Ahmed', 'Omar', 'Ali', 'Hassan', 'Abdullah', 'Yusuf', 'Hamza', 'Khaled',
    'Carlos', 'Alejandro', 'Juan', 'Diego', 'Mateo', 'Santiago', 'Nicolas', 'Daniel', 'Gabriel', 'Lucas',
    'Wei', 'Ming', 'Hao', 'Chen', 'Jun', 'Yuki', 'Hiroshi', 'Kenji', 'Takeshi', 'Ryu'
  ],
  female: [
    'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen',
    'Nancy', 'Lisa', 'Betty', 'Margaret', 'Sandra', 'Ashley', 'Kimberly', 'Emily', 'Donna', 'Michelle',
    'Dorothy', 'Carol', 'Amanda', 'Melissa', 'Deborah', 'Stephanie', 'Rebecca', 'Laura', 'Sharon', 'Cynthia',
    'Kathleen', 'Amy', 'Shirley', 'Angela', 'Helen', 'Anna', 'Brenda', 'Pamela', 'Nicole', 'Emma',
    'Olivia', 'Amelia', 'Isla', 'Ava', 'Ivy', 'Lily', 'Florence', 'Mia', 'Willow', 'Elsie',
    'Daisy', 'Freya', 'Poppy', 'Emily', 'Ella', 'Evelyn', 'Phoebe', 'Sienna', 'Charlotte', 'Grace',
    'Fatima', 'Aisha', 'Mariam', 'Zahra', 'Layla', 'Noor', 'Yasmin', 'Hana', 'Salma', 'Noura',
    'Sofia', 'Isabella', 'Valentina', 'Camila', 'Valeria', 'Luciana', 'Mariana', 'Victoria', 'Daniela', 'Martina',
    'Emma', 'Jade', 'Alice', 'Juliette', 'Chloe', 'Lea', 'Sarah', 'Manon', 'Lena', 'Zoe',
    'Yui', 'Sakura', 'Hana', 'Akari', 'Yuna', 'Mei', 'Li', 'Wang', 'Zhang', 'Liu'
  ]
};

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
  'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes', 'Stewart',
  'Morris', 'Morales', 'Murphy', 'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper', 'Peterson',
  'Bailey', 'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson', 'Watson',
  'Brooks', 'Chavez', 'Wood', 'James', 'Bennett', 'Gray', 'Mendoza', 'Ruiz', 'Hughes', 'Price',
  'Alvarez', 'Castillo', 'Sanders', 'Patel', 'Myers', 'Long', 'Ross', 'Foster', 'Jimenez', 'Powell',
  'Jenkins', 'Perry', 'Russell', 'Sullivan', 'Bell', 'Coleman', 'Butler', 'Henderson', 'Barnes', 'Gomez',
  'Ahmed', 'Ali', 'Khan', 'Hassan', 'Mohamed', 'Abdullah', 'Saeed', 'Rahman', 'Hussein', 'Mahmoud',
  'Ivanov', 'Smirnov', 'Kuznetsov', 'Popov', 'Vasiliev', 'Petrov', 'Sokolov', 'Mikhailov', 'Fedorov', 'Morozov',
  'Mueller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Hoffmann', 'Schulz',
  'Silva', 'Santos', 'Oliveira', 'Pereira', 'Costa', 'Rodrigues', 'Martins', 'Jesus', 'Sousa', 'Fernandes',
  'Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco',
  'Wang', 'Li', 'Zhang', 'Liu', 'Chen', 'Yang', 'Huang', 'Zhao', 'Wu', 'Zhou',
  'Tanaka', 'Suzuki', 'Takahashi', 'Watanabe', 'Ito', 'Yamamoto', 'Nakamura', 'Kobayashi', 'Kato', 'Yoshida',
  'Kim', 'Lee', 'Park', 'Choi', 'Jung', 'Kang', 'Cho', 'Yoon', 'Jang', 'Lim',
  'Chan', 'Chow', 'Chung', 'Lau', 'Ng', 'Wong', 'Cheung', 'Tang', 'Ho', 'Yuen'
];

const COMPANY_PREFIXES = [
  'Tech', 'Smart', 'Digital', 'Cloud', 'Data', 'Cyber', 'Net', 'Web', 'App', 'Code',
  'Innovate', 'Future', 'Next', 'Modern', 'Prime', 'Elite', 'Pro', 'Max', 'Ultra', 'Super',
  'Green', 'Eco', 'Pure', 'Fresh', 'Clean', 'Zen', 'Aura', 'Glow', 'Bloom', 'Vital',
  'Bold', 'Epic', 'Vivid', 'Spark', 'Pulse', 'Rise', 'Thrive', 'Spark', 'Nova', 'Flux',
  'Swift', 'Rapid', 'Quick', 'Flash', 'Dash', 'Zoom', 'Boost', 'Jet', 'Aero', 'Velocity',
  'True', 'Real', 'Pure', 'Direct', 'Core', 'Base', 'Solid', 'Firm', 'Steady', 'Stable',
  'Happy', 'Joy', 'Bliss', 'Sunny', 'Bright', 'Cheer', 'Delight', 'Glee', 'Merry', 'Jolly'
];

const COMPANY_SUFFIXES = [
  'Solutions', 'Systems', 'Services', 'Labs', 'Works', 'Studio', 'Hub', 'Zone', 'Space', 'Place',
  'Dynamics', 'Logic', 'Mind', 'Brain', 'Intel', 'Think', 'Insight', 'Vision', 'View', 'Scope',
  'Forge', 'Craft', 'Build', 'Make', 'Create', 'Form', 'Shape', 'Design', 'Style', 'Mode',
  'Stream', 'Wave', 'Flow', 'Pulse', 'Drift', 'Current', 'Tide', 'Surge', 'Splash', 'Spray',
  'Nest', 'Den', 'Haven', 'Harbor', 'Port', 'Base', 'Camp', 'Post', 'Center', 'Point',
  'Sphere', 'Orb', 'Globe', 'World', 'Realm', 'Domain', 'Field', 'Scope', 'Range', 'Reach',
  'Verse', 'Tale', 'Story', 'Saga', 'Epic', 'Chronicle', 'Journal', 'Log', 'Record', 'Archive'
];

const BRAND_ADJECTIVES = [
  'Premium', 'Elite', 'Luxury', 'Select', 'Exclusive', 'Signature', 'Authentic', 'Original',
  'Natural', 'Organic', 'Pure', 'Fresh', 'Raw', 'Clean', 'Green', 'Eco', 'Sustainable',
  'Smart', 'Intelligent', 'Advanced', 'Modern', 'Future', 'Next', 'Innovative', 'Cutting-edge',
  'Happy', 'Joyful', 'Cheerful', 'Bright', 'Sunny', 'Vibrant', 'Dynamic', 'Energetic',
  'Cozy', 'Warm', 'Soft', 'Gentle', 'Smooth', 'Silky', 'Velvet', 'Plush',
  'Bold', 'Daring', 'Brave', 'Strong', 'Powerful', 'Intense', 'Fierce', 'Wild',
  'Calm', 'Peaceful', 'Serene', 'Tranquil', 'Quiet', 'Still', 'Gentle', 'Mild'
];

const BRAND_NOUNS = [
  'Life', 'Living', 'Lifestyle', 'Way', 'Path', 'Journey', 'Road', 'Route',
  'Home', 'House', 'Place', 'Space', 'Room', 'Spot', 'Site', 'Zone',
  'Craft', 'Art', 'Skill', 'Trade', 'Work', 'Labor', 'Effort', 'Toil',
  'Goods', 'Wares', 'Products', 'Items', 'Pieces', 'Works', 'Makes', 'Creates',
  'Essence', 'Core', 'Heart', 'Soul', 'Spirit', 'Being', 'Nature', 'Character',
  'Form', 'Shape', 'Figure', 'Frame', 'Build', 'Make', 'Model', 'Pattern',
  'Glow', 'Shine', 'Gleam', 'Sparkle', 'Glitter', 'Radiance', 'Light', 'Bright'
];

const USERNAME_ADJECTIVES = [
  'happy', 'creative', 'curious', 'bright', 'sunny', 'wild', 'calm', 'cosmic',
  'digital', 'virtual', 'cyber', 'tech', 'smart', 'clever', 'wise', 'bright',
  'stylish', 'trendy', 'cool', 'fresh', 'bold', 'brave', 'fierce', 'fearless',
  'wandering', 'roaming', 'exploring', 'adventurous', 'traveling', 'nomadic', 'roving', 'drifting',
  'authentic', 'genuine', 'real', 'true', 'honest', 'pure', 'natural', 'original'
];

const USERNAME_NOUNS = [
  'soul', 'spirit', 'heart', 'mind', 'dream', 'vision', 'journey', 'path',
  'creator', 'maker', 'builder', 'designer', 'artist', 'writer', 'thinker', 'dreamer',
  'explorer', 'adventurer', 'wanderer', 'traveler', 'nomad', 'rover', 'drifter', 'voyager',
  'insider', 'guru', 'expert', 'pro', 'master', 'ninja', 'wizard', 'genius',
  'vibes', 'energy', 'aura', 'flow', 'glow', 'spark', 'pulse', 'wave',
  'life', 'world', 'universe', 'galaxy', 'planet', 'realm', 'sphere', 'zone',
  'chronicles', 'tales', 'stories', 'sagas', 'journals', 'logs', 'records', 'diaries'
];

/**
 * Generate a random item from an array
 * @param {Array} arr 
 * @returns {any}
 */
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generate multiple random items from an array
 * @param {Array} arr 
 * @param {number} count 
 * @returns {Array}
 */
function pickMultiple(arr, count) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

/**
 * Generate a realistic full name
 * @param {string} gender - 'male', 'female', or 'random'
 * @returns {object}
 */
function generateName(gender = 'random') {
  const actualGender = gender === 'random' 
    ? (Math.random() > 0.5 ? 'male' : 'female')
    : gender;
  
  const firstName = pick(FIRST_NAMES[actualGender]);
  const lastName = pick(LAST_NAMES);
  
  return {
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
    gender: actualGender
  };
}

/**
 * Generate a company name
 * @returns {string}
 */
function generateCompanyName() {
  const patterns = [
    () => `${pick(COMPANY_PREFIXES)}${pick(COMPANY_SUFFIXES)}`,
    () => `${pick(COMPANY_PREFIXES)} ${pick(COMPANY_SUFFIXES)}`,
    () => `${pick(LAST_NAMES)} ${pick(COMPANY_SUFFIXES)}`,
    () => `${pick(BRAND_ADJECTIVES)} ${pick(BRAND_NOUNS)}`,
    () => `${pick(LAST_NAMES)} & ${pick(LAST_NAMES)}`,
    () => `${pick(COMPANY_PREFIXES)}${pick(LAST_NAMES)}`
  ];
  
  return pick(patterns)();
}

/**
 * Generate a username
 * @param {string} firstName 
 * @param {string} lastName 
 * @returns {string}
 */
function generateUsername(firstName, lastName) {
  const patterns = [
    () => `${firstName.toLowerCase()}${lastName.toLowerCase()}`,
    () => `${firstName.toLowerCase()}_${lastName.toLowerCase()}`,
    () => `${firstName.toLowerCase()}${lastName.toLowerCase()}${Math.floor(Math.random() * 99) + 1}`,
    () => `${pick(USERNAME_ADJECTIVES)}${firstName}`,
    () => `${firstName}${pick(USERNAME_NOUNS)}`,
    () => `${pick(USERNAME_ADJECTIVES)}_${pick(USERNAME_NOUNS)}`,
    () => `${firstName.toLowerCase().slice(0, 3)}${lastName.toLowerCase()}${Math.floor(Math.random() * 999)}`
  ];
  
  return pick(patterns)();
}

/**
 * Generate a brand name
 * @returns {string}
 */
function generateBrandName() {
  const patterns = [
    () => `${pick(BRAND_ADJECTIVES)} ${pick(BRAND_NOUNS)}`,
    () => `${pick(COMPANY_PREFIXES)}${pick(BRAND_NOUNS)}`,
    () => `${pick(LAST_NAMES)}'s`,
    () => `${pick(BRAND_ADJECTIVES)}${pick(COMPANY_SUFFIXES)}`,
    () => `${pick(BRAND_NOUNS)}${pick(COMPANY_SUFFIXES)}`
  ];
  
  return pick(patterns)();
}

/**
 * Generate a social media handle/username
 * @returns {string}
 */
function generateHandle() {
  const adjectives = ['real', 'the', 'official', 'hey', 'its', 'iam', 'mr', 'ms', 'dr', 'happy', 'creative'];
  const nouns = ['life', 'world', 'style', 'journey', 'vibes', 'daily', 'chronicles', 'diaries', 'adventures'];
  const suffixes = ['', 'official', 'hq', 'co', `${Math.floor(Math.random() * 999)}`];
  
  return `${pick(adjectives)}${pick(nouns)}${pick(suffixes)}`.replace(/[^a-z0-9]/g, '');
}

module.exports = {
  FIRST_NAMES,
  LAST_NAMES,
  COMPANY_PREFIXES,
  COMPANY_SUFFIXES,
  BRAND_ADJECTIVES,
  BRAND_NOUNS,
  USERNAME_ADJECTIVES,
  USERNAME_NOUNS,
  pick,
  pickMultiple,
  generateName,
  generateCompanyName,
  generateUsername,
  generateBrandName,
  generateHandle
};
