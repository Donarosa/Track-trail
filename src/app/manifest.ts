import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TrackTrail',
    short_name: 'TrackTrail',
    description: 'Entrenamiento de running para corredores y entrenadores',
    start_url: '/',
    display: 'standalone',
    background_color: '#DAD7CD',
    theme_color: '#1B4332',
    orientation: 'portrait',
    icons: [
      {
        src: '/icons/icon-192.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
      },
      {
        src: '/icons/icon-512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
      },
      {
        src: '/icons/icon-512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  };
}
