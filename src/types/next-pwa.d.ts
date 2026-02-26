declare module 'next-pwa' {
  import type { NextConfig } from 'next';

  interface PWAConfig {
    dest?: string;
    disable?: boolean;
    register?: boolean;
    skipWaiting?: boolean;
    sw?: string;
    scope?: string;
  }

  export default function withPWA(config?: PWAConfig): (nextConfig: NextConfig) => NextConfig;
}
