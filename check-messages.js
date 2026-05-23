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

const checkTable = async (table) => {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/${table}?select=*&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });
    console.log(`Table: ${table}`);
    console.log(`Status: ${res.status}`);
    const data = await res.json();
    console.log(`Sample Data:`, data);
  } catch (err) {
    console.error(`Error on ${table}:`, err);
  }
};

await checkTable('conversations');
await checkTable('conversation_members');
await checkTable('messages');
