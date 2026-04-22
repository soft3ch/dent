//change the import by require
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient("https://afquvakluazrkoxhfsvj.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmcXV2YWtsdWF6cmtveGhmc3ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMzE1MTYsImV4cCI6MjA4OTYwNzUxNn0.FGPwv5jdaR-fLH24swOsN2CVWOG6F5vP7VKv4U0B3-Y")
const { data, error } = supabase.functions.invoke('send-reminders', {
    body: { name: 'Functions' },
})
console.log(data, error)