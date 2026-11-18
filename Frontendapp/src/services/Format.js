// Small helpers to show dates in the user's own language and format
export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : ''

export const fmtDateTime = (d) =>
  d
    ? new Date(d).toLocaleString(undefined, {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : ''

// "just now", "12 min ago", "3 h ago", "2 days ago"
export const timeAgo = (d) => {
  if (!d) return ''
  const min = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min} min ago`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h} h ago`
  const days = Math.floor(h / 24)
  return `${days} day${days > 1 ? 's' : ''} ago`
}

// How many hours since a date (used to flag tickets that wait too long)
export const ageHours = (d) => (d ? (Date.now() - new Date(d).getTime()) / 3600000 : 0)
