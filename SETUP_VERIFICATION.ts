/**
 * Setup Verification Script
 * Run this in browser console to verify your Supabase setup
 * 
 * Usage: 
 * 1. Open browser DevTools (F12)
 * 2. Go to Console tab
 * 3. Copy-paste this entire file and press Enter
 * 4. Follow the prompts
 */

console.log('🔧 Chai Machine - Setup Verification\n');

// Check environment variables
console.log('1️⃣ Checking environment variables...');
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (url && key) {
  console.log('✅ Environment variables found');
  console.log(`   URL: ${url}`);
  console.log(`   Key: ${key.slice(0, 10)}...`);
} else {
  console.error('❌ Missing environment variables in .env.local');
  console.log('   Required: VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY');
}

// Check Supabase client
console.log('\n2️⃣ Checking Supabase connection...');
import { supabase, checkConnection } from '@/lib/supabase';

checkConnection().then(({ connected, error }) => {
  if (connected) {
    console.log('✅ Connected to Supabase');
  } else {
    console.error('❌ Failed to connect:', error);
  }
});

// Check tables
console.log('\n3️⃣ Checking database tables...');
import { checkTableExists } from '@/lib/initialization';

const tables = ['users', 'inventory', 'sales', 'sale_items'];
Promise.all(tables.map(t => checkTableExists(t))).then(results => {
  tables.forEach((table, idx) => {
    console.log(`   ${results[idx] ? '✅' : '❌'} ${table}`);
  });
  
  if (results.some(r => !r)) {
    console.warn('\n⚠️ Some tables are missing. See DATABASE_SETUP.md');
  } else {
    console.log('\n✅ All tables exist!');
  }
});

// Test CRUD operations
console.log('\n4️⃣ Testing CRUD operations...');
import { getInventory } from '@/lib/crud-inventory';

getInventory().then(({ items, error }) => {
  if (error) {
    console.error('❌ Failed to fetch inventory:', error);
  } else {
    console.log(`✅ Inventory loaded: ${items.length} items`);
  }
});

console.log('\n✨ Verification complete! Check messages above.');
console.log('\n📖 For setup help, see PROJECT_README.md and DATABASE_SETUP.md');
