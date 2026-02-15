import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Supabase environment variables missing in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const command = process.argv[2];

  console.log('--- 🧹 Translation System Maintenance ---');

  if (command === 'stats') {
    const { data: stats, error } = await supabase.rpc('get_translation_cache_stats');
    if (error) {
      console.error('❌ Error fetching stats:', error.message);
    } else {
      console.log('📊 Current Statistics:', JSON.stringify(stats[0], null, 2));
    }
  } 
  else if (command === 'cleanup') {
    console.log('🗑️ Cleaning up old cache entries (keeping top 10k)...');
    const { data, error } = await supabase.rpc('cleanup_translation_cache');
    if (error) {
      console.error('❌ Error cleaning up:', error.message);
    } else {
      console.log(`✅ Success! Deleted ${data?.[0]?.deleted_count || 0} entries.`);
    }
  }
  else {
    console.log('Usage:');
    console.log('  npm run translation:stats    - View cache statistics');
    console.log('  npm run translation:cleanup  - Clean up old entries');
  }
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
