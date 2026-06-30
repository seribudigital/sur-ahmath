/**
 * Format date to local Indonesian date string.
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Format response time to readable second/millisecond string.
 */
export function formatResponseTime(ms: number): string {
  if (ms < 1000) {
    return `${ms} ms`;
  }
  return `${(ms / 1000).toFixed(1)} dtk`;
}

/**
 * Get dynamic tailwind/CSS class name for heatmap cells based on status.
 */
export function getStatusColorClass(status: 'master' | 'practice' | 'weak'): string {
  switch (status) {
    case 'master':
      return 'bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600'; // Success / Green
    case 'weak':
      return 'bg-rose-500 text-white border-rose-600 hover:bg-rose-600'; // Alert / Red
    case 'practice':
    default:
      return 'bg-amber-500 text-white border-amber-600 hover:bg-amber-600'; // Learning / Orange
  }
}
