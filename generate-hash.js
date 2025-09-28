const crypto = require('crypto');

// Generate a secure random secret hash
function generateSecretHash(length = 32) {
    return crypto.randomBytes(length).toString('hex');
}

// Generate multiple options
console.log('Secret Hash Options (choose one):');
console.log('================================');

for (let i = 1; i <= 5; i++) {
    const hash = generateSecretHash();
    console.log(`Option ${i}: ${hash}`);
}

console.log('\nInstructions:');
console.log('1. Choose one of the above hashes');
console.log('2. Add it to your Flutterwave dashboard webhook settings');
console.log('3. Store it as FLW_SECRET_HASH in your environment variables');
console.log('4. NEVER expose this hash in your code or version control');

// Example of how to use in environment variable
console.log('\nAdd to your .env file:');
console.log('FLW_SECRET_HASH=your_chosen_hash_here');

// Validate hash strength
function validateSecretHash(hash) {
    if (!hash) {
        return { valid: false, message: 'Hash is required' };
    }
    
    if (hash.length < 32) {
        return { valid: false, message: 'Hash should be at least 32 characters long' };
    }
    
    if (!/^[a-f0-9]+$/i.test(hash)) {
        return { valid: false, message: 'Hash should contain only hexadecimal characters' };
    }
    
    return { valid: true, message: 'Hash is strong and valid' };
}

// Test validation
const testHash = generateSecretHash();
const validation = validateSecretHash(testHash);
console.log(`\nValidation test: ${validation.message}`);

module.exports = { generateSecretHash, validateSecretHash };