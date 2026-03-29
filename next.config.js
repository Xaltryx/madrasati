/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // تأكد من عدم وجود أي redirects هنا تعارض الـ middleware
  // إذا كنت تستخدم صور خارجية من Supabase أضف النطاق هنا:
  images: {
    domains: ['*.supabase.co'],
  },
}

module.exports = nextConfig