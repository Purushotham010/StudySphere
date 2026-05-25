import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env.local
const envFile = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing environment variables!");
  process.exit(1);
}

const tables = [
  'profiles',
  'user_skills',
  'connections',
  'opportunities',
  'bookmarks',
  'community_posts',
  'post_replies',
  'post_likes',
  'conversations',
  'conversation_members',
  'messages',
  'mentor_sessions'
];

console.log("Checking table endpoints on Supabase REST API...");
for (const table of tables) {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/${table}?select=*&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Prefer': 'count=exact'
      }
    });
    console.log(`Table '${table}': HTTP ${res.status} ${res.statusText}`);
    if (res.status !== 200 && res.status !== 204) {
      const errText = await res.text();
      console.log(`  Response: ${errText}`);
    }
  } catch (err) {
    console.error(`  Error checking table '${table}':`, err);
  }
}
