import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const missingConfigMessage =
  'Supabase configuration missing. Define VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.';

const fallbackClient = {
  from() {
    throw new Error(missingConfigMessage);
  },
  auth: {
    getSession: async () => ({
      data: null,
      error: new Error(missingConfigMessage)
    })
  }
};

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(missingConfigMessage);
}

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false
        }
      })
    : fallbackClient;
