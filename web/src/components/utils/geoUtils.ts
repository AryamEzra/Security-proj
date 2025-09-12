export function getColorForCount(count: number): string {
  if (count > 10) return '#ef4444 dark:#f87171';    // red / lighter red
  if (count > 5) return '#f59e0b dark:#fbbf24';     // amber / lighter amber
  if (count > 2) return '#10b981 dark:#34d399';     // green / lighter green
  return '#3b82f6 dark:#60a5fa';                    // blue / lighter blue
}

export function getTopCountries(countryCounts: Record<string, number>, limit: number = 8) {
  return Object.entries(countryCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, limit);
}