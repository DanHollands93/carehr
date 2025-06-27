
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sigotixiaujnhbolqctv.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpZ290aXhpYXVqbmhib2xxY3R2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ1ODI2ODksImV4cCI6MjA2MDE1ODY4OX0.nz1WOdvY5VDdbWk4ehADKA0Iql0PNhcjBitHJr70-LM'

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
})
