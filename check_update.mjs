import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envText = fs.readFileSync('.env', 'utf-8');
const env = {};
envText.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data: { users }, error: authErr } = await supabase.auth.admin.listUsers(); // might fail due to anon key
  console.log("auth admin err:", authErr);
  
  // Let's try to update the first profile's created_at using the anon key
  const profileId = 'e1ef3609-30d0-4cf9-ade7-bda55c0ce19b';
  const newDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
  console.log("Attempting to update profile created_at to:", newDate);
  const { data, error } = await supabase.from('profiles').update({ created_at: newDate }).eq('id', profileId).select();
  console.log("Update result:", data, "Error:", error);
}
check();
