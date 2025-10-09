// Quick test to verify service account environment variable works
require('dotenv').config({ path: '.env.local' });

console.log('🔍 Testing Service Account Environment Variable...\n');

try {
  // Check if environment variable exists
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    throw new Error('❌ GOOGLE_SERVICE_ACCOUNT_KEY not found in environment');
  }
  
  console.log('✅ Environment variable found');
  
  // Try to parse it as JSON
  const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
  
  // Verify it has expected fields
  const requiredFields = ['type', 'project_id', 'private_key_id', 'private_key', 'client_email'];
  const missingFields = requiredFields.filter(field => !serviceAccount[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`❌ Missing required fields: ${missingFields.join(', ')}`);
  }
  
  console.log('✅ JSON parsed successfully');
  console.log('✅ All required fields present');
  console.log(`\n📋 Service Account Details:`);
  console.log(`   Type: ${serviceAccount.type}`);
  console.log(`   Project ID: ${serviceAccount.project_id}`);
  console.log(`   Client Email: ${serviceAccount.client_email}`);
  console.log('\n✨ SUCCESS: Service account is properly configured as environment variable!');
  
} catch (error) {
  console.error('❌ ERROR:', error.message);
  process.exit(1);
}
