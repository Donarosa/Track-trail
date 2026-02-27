'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const trainerNav: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/trainings', label: 'Entrenamientos', icon: '🏃' },
  { href: '/runners', label: 'Corredores', icon: '👥' },
];

const runnerNav: NavItem[] = [
  { href: '/dashboard', label: 'Inicio', icon: '📊' },
  { href: '/actividades', label: 'Mis Actividades', icon: '🏃' },
  { href: '/profile', label: 'Perfil', icon: '👤' },
];

const adminNav: NavItem[] = [
  { href: '/admin', label: 'Administración', icon: '⚙️' },
];

const profileNav: NavItem[] = [
  { href: '/profile', label: 'Perfil', icon: '👤' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { profile } = useAuth();

  if (!profile) return null;

  let navItems: NavItem[] = [];

  if (profile.role === 'trainer') {
    navItems = [...trainerNav, ...profileNav];
  } else if (profile.role === 'superadmin') {
    navItems = [...trainerNav, ...adminNav, ...profileNav];
  } else if (profile.role === 'runner') {
    navItems = runnerNav;
  }

  return (
    <aside className="hidden md:flex flex-col w-56 bg-tt-white border-r border-highlight/30 min-h-[calc(100dvh-3.5rem)]">
      <nav className="flex flex-col gap-1 p-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-foreground/70 hover:bg-highlight/20 hover:text-foreground'
                }
              `}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
