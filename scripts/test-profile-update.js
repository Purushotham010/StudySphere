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

async function test() {
  console.log("Searching for profile matching purushothamchowdam401@gmail.com...");
  
  // 1. Fetch the profile
  const fetchRes = await fetch(`${supabaseUrl}/rest/v1/profiles?email=eq.purushothamchowdam401@gmail.com&select=*`, {
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`
    }
  });
  
  const profiles = await fetchRes.json();
  console.log("Fetch profiles response:", fetchRes.status, fetchRes.statusText, profiles);
  
  if (!profiles || profiles.length === 0) {
    console.log("No profile found with that email! Let's fetch all profiles...");
    const fetchAll = await fetch(`${supabaseUrl}/rest/v1/profiles?select=*&limit=5`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });
    const allProfs = await fetchAll.json();
    console.log("All profiles:", allProfs);
    return;
  }
  
  const targetProfile = profiles[0];
  console.log("Target profile ID:", targetProfile.id);
  
  // 2. Attempt update using anon key
  console.log("Attempting to update target profile name to test value...");
  const updateRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${targetProfile.id}`, {
    method: 'PATCH',
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      full_name: "Test Update Name"
    })
  });
  
  console.log("Update response status:", updateRes.status, updateRes.statusText);
  try {
    const data = await updateRes.json();
    console.log("Update response data:", data);
  } catch (e) {
    const text = await updateRes.text();
    console.log("Update response text:", text);
  }
}

test().catch(err => console.error("Unhandled error:", err));
