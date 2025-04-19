/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://xuktdxadhwvdpmzscvgg.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1a3RkeGFkaHd2ZHBtenNjdmdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ1ODYyMTcsImV4cCI6MjA2MDE2MjIxN30.OX7_vI_m3V1j_YobAyycZKN03BQEr9HzEEDlIP399vI',
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  },
  // ...other config options
}

module.exports = nextConfig 