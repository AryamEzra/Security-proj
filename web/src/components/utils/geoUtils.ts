export function getColorForCount(count: number, theme: string): string {
  if (count > 10) return theme === 'dark' ? '#f87171' : '#ef4444';
  if (count > 5) return theme === 'dark' ? '#fbbf24' : '#f59e0b';
  if (count > 2) return theme === 'dark' ? '#34d399' : '#10b981';
  return theme === 'dark' ? '#60a5fa' : '#3b82f6';
}

export function getTopCountries(countryCounts: Record<string, number>, limit: number = 8) {
  return Object.entries(countryCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, limit);
}