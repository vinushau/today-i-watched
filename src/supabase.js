import { createClient } from "@supabase/supabase-js";
const supabaseUrl = process.env.REACT_APP_BASE_URL2;
const supabaseKey = process.env.REACT_APP_API_KEY2;

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
