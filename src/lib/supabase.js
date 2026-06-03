import { createClient } from "@supabase/supabase-js";

console.log(import.meta.env);
console.log("URL =", import.meta.env.VITE_SUPABASE_URL);
console.log("KEY =", import.meta.env.VITE_SUPABASE_ANON_KEY);
console.log("FULL ENV", import.meta.env);

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);