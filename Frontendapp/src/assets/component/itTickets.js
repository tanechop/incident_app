// Small helpers shared by the IT pages (dashboard, available and assigned tickets)

export const PRIORITY = {
  high: { label: 'High', rank: 0 },
  medium: { label: 'Medium', rank: 1 },
  low: { label: 'Low', rank: 2 },
}

export const STATUS = {
  open: 'To start',
  in_progress: 'In progress',
  resolved: 'Resolved',
  closed: 'Closed',
}

export const SORTS = [
  { key: 'priority', label: 'Priority first' },
  { key: 'oldest', label: 'Oldest first' },
  { key: 'newest', label: 'Newest first' },
]

const time = (t) => new Date(t.created_at).getTime()

// Returns a sorted copy. "priority" puts urgent tickets first, oldest first inside a priority.
export function sortTickets(list, mode) {
  const copy = [...list]
  if (mode === 'newest') return copy.sort((a, b) => time(b) - time(a))
  if (mode === 'oldest') return copy.sort((a, b) => time(a) - time(b))
  return copy.sort(
    (a, b) =>
      (PRIORITY[a.priority]?.rank ?? 9) - (PRIORITY[b.priority]?.rank ?? 9) || time(a) - time(b)
  )
}

// Text search over the fields an IT user looks at
export function matchesQuery(t, query) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return [t.id, t.title, t.description, t.created_by_name, t.category_name].some((v) =>
    String(v ?? '').toLowerCase().includes(q)
  )
}
