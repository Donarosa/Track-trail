export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDistance(km: number): string {
  return `${km.toFixed(1)} km`;
}

export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h > 0) {
    return `${h}h ${m.toString().padStart(2, '0')}m`;
  }
  return `${m} min`;
}

export function formatPace(km: number, minutes: number): string {
  if (km <= 0) return '—';
  const pace = minutes / km;
  const paceMin = Math.floor(pace);
  const paceSec = Math.round((pace - paceMin) * 60);
  return `${paceMin}:${paceSec.toString().padStart(2, '0')} /km`;
}
