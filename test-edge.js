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

async function testEdgeFunction() {
  console.log("Invoking edge function at:", `${supabaseUrl}/functions/v1/studysphere-ai-mentor`);
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/studysphere-ai-mentor`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Hello" }],
        stream: false
      })
    });
    
    console.log("Status:", res.status);
    console.log("Headers:", res.headers);
    
    if (!res.ok) {
      console.error("Error body:", await res.text());
    } else {
      console.log("Success:", await res.json());
    }
  } catch(e) {
    console.error("Fetch failed:", e);
  }
}

testEdgeFunction();
