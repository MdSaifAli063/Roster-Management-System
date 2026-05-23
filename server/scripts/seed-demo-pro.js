/**
 * Creates / updates a demo employer with Business plan (all features, no limits).
 * Usage: npm run db:seed-demo
 */
const { loadEnv } = require('../loadEnv');
loadEnv();

const { ensureV2Schema } = require('../db/ensureV2Schema');
const { seedSubscriptionPlans } = require('../services/subscription');
const { ensureDemoAccount } = require('../services/demoAccountSeed');
const { DEMO_EMAIL } = require('../constants/demoAccount');

async function main() {
  await ensureV2Schema();
  await seedSubscriptionPlans();
  await ensureDemoAccount();
  console.log('\n✅ Demo account ready (Business — all features free)\n');
  console.log(`   Email:    ${DEMO_EMAIL}`);
  console.log('   Password: DemoPro2025!\n');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
