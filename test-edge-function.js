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

console.log("Invoking Edge Function 'studysphere-ai-mentor'...");
try {
  const res = await fetch(`${supabaseUrl}/functions/v1/studysphere-ai-mentor`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`
    },
    body: JSON.stringify({
      messages: [
        { role: 'user', content: 'Hello' }
      ],
      stream: false
    })
  });

  console.log(`HTTP Status: ${res.status} ${res.statusText}`);
  const text = await res.text();
  console.log(`Response Body:\n${text}`);
} catch (err) {
  console.error("Failed to make request:", err);
}
