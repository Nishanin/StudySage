const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
);

async function checkSupabaseConnection() {
  const { error } = await supabase.from("users").select("id").limit(1);

  if (error) console.log("Failed to connect to Supabase");
  else console.log("Successfully connected to Supabase");
}

if (process.env.NODE_ENV == "production") checkSupabaseConnection();

module.exports = supabase;
