import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Environment variables prefixed with NEXT_PUBLIC_ are automatically exposed to the browser
  // No additional configuration needed for NEXT_PUBLIC_GOOGLE_CLIENT_ID

  // ESLint configuration for production builds
  eslint: {
    // Only fail build on ESLint errors, not warnings
    ignoreDuringBuilds: false,
  },
  
  // Webpack configuration to handle server-only modules
  webpack: (config, { isServer }) => {
    // Exclude Node.js built-in modules and server-only packages from client bundle
    // This fixes the "Module not found: Can't resolve 'net'" error
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        dns: false,
        fs: false,
        http2: false,
        child_process: false,
        crypto: false,
      };
      
      // Exclude server-only packages from client bundle
      config.resolve.alias = {
        ...config.resolve.alias,
        '@google-cloud/secret-manager': false,
      };
    }
    return config;
  },
  
  // Override NEXTAUTH_URL for local development to prevent fetch errors
  env: {
    NEXTAUTH_URL: process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000' 
      : process.env.NEXTAUTH_URL || 'https://www.antocciphysics.com',
  },
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh4.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh5.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh6.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://accounts.google.com https://www.youtube.com https://s.ytimg.com",
              // pdf.js (react-pdf) spawns a web worker, often from a blob URL.
              "worker-src 'self' blob:",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://lh3.googleusercontent.com https://lh4.googleusercontent.com https://lh5.googleusercontent.com https://lh6.googleusercontent.com https://*.googleusercontent.com https://i.ytimg.com https://img.youtube.com",
              `connect-src 'self' https://api.supabase.com ${process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ymszffulqmkqgvhioege.supabase.co'} https://classroom.googleapis.com https://www.googleapis.com`,
              // include the Supabase storage origin so the chapter PDF can render in a native-viewer iframe fallback.
              `frame-src 'self' ${process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ymszffulqmkqgvhioege.supabase.co'} https://accounts.google.com https://content.googleapis.com https://www.youtube.com https://www.youtube-nocookie.com`,
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
