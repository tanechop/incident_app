// Builds the notification email (subject, plain text and HTML) from a ticket.
// Pure functions with no imports, so they are easy to test.

const PRIORITY = {
  high: { label: 'High', color: '#dc3545' },
  medium: { label: 'Medium', color: '#f59f00' },
  low: { label: 'Low', color: '#198754' },
}

const STATUS = {
  open: { label: 'Open', color: '#0d6efd' },
  in_progress: { label: 'In progress', color: '#f59f00' },
  resolved: { label: 'Resolved', color: '#198754' },
  closed: { label: 'Closed', color: '#6c757d' },
}

export const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const formatDate = (value) => {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
}

const oneLine = (value) => String(value ?? '').replace(/\s+/g, ' ').trim()

// The list of facts shown in the email, in reading order. Empty ones are skipped.
function ticketFacts(ticket) {
  const priority = PRIORITY[ticket.priority]
  const status = STATUS[ticket.status]
  const assigned = ticket.assigned_to_name
    ? `${ticket.assigned_to_name}${ticket.queued ? ' (waiting in the queue)' : ''}`
    : 'Not assigned yet'
  const creator = ticket.created_by_name
    ? `${ticket.created_by_name}${ticket.created_by_email ? ` (${ticket.created_by_email})` : ''}`
    : ''

  return [
    { label: 'Ticket number', value: `#${ticket.id}` },
    { label: 'Title', value: oneLine(ticket.title) },
    { label: 'Priority', value: priority?.label || ticket.priority, color: priority?.color },
    { label: 'Status', value: status?.label || ticket.status, color: status?.color },
    { label: 'Category', value: ticket.category_name || '' },
    { label: 'Created by', value: creator },
    { label: 'Assigned to', value: assigned },
    { label: 'Created on', value: formatDate(ticket.created_at) },
    { label: 'Assigned on', value: formatDate(ticket.assigned_at) },
    { label: 'Closed on', value: formatDate(ticket.closed_at) },
    { label: 'Attachment', value: ticket.attachment_name || '' },
  ].filter((f) => f.value)
}

// Plain-text email for clients that do not show HTML
function buildText({ recipientName, message, ticket, appUrl }) {
  const facts = ticketFacts(ticket)
  const width = Math.max(...facts.map((f) => f.label.length))
  const lines = [
    `Hello${recipientName ? ` ${recipientName}` : ''},`,
    '',
    message,
    '',
    'TICKET DETAILS',
    '--------------',
    ...facts.map((f) => `${f.label.padEnd(width)} : ${f.value}`),
    '',
    'DESCRIPTION',
    '-----------',
    (ticket.description || '').trim() || 'No description',
  ]
  if (ticket.resolution?.trim()) {
    lines.push('', 'RESOLUTION', '----------', ticket.resolution.trim())
  }
  if (appUrl) lines.push('', `Open the platform: ${appUrl}`)
  lines.push('', '-- GLOBAL SERVICE')
  return lines.join('\n')
}

const textBlock = (title, body, accent) => `
  <tr><td style="padding:18px 28px 0">
    <div style="font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#64748b;margin-bottom:6px">${title}</div>
    <div style="background:#f8fafc;border-left:4px solid ${accent};border-radius:6px;padding:12px 14px;font-size:14px;line-height:1.55;color:#0f172a;white-space:pre-wrap;word-wrap:break-word">${escapeHtml(body)}</div>
  </td></tr>`

function buildHtml({ recipientName, message, ticket, appUrl }) {
  const rows = ticketFacts(ticket)
    .map((f) => {
      const value = f.color
        ? `<span style="display:inline-block;padding:2px 10px;border-radius:999px;background:${f.color};color:#fff;font-size:12px;font-weight:600">${escapeHtml(f.value)}</span>`
        : escapeHtml(f.value)
      return `<tr>
        <td style="padding:8px 0;width:130px;color:#64748b;font-size:13px;vertical-align:top">${escapeHtml(f.label)}</td>
        <td style="padding:8px 0;color:#0f172a;font-size:14px;font-weight:${f.label === 'Title' ? 600 : 400}">${value}</td>
      </tr>`
    })
    .join('')

  const button = appUrl
    ? `<tr><td style="padding:22px 28px 0"><a href="${escapeHtml(appUrl)}" style="display:inline-block;background:#198754;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:600">Open the platform</a></td></tr>`
    : ''

  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#eef2f6;font-family:Segoe UI,Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f6;padding:24px 12px"><tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden">
    <tr><td style="background:#1e293b;padding:18px 28px;color:#ffffff;font-size:16px;font-weight:700;letter-spacing:.04em">GLOBAL SERVICE</td></tr>
    <tr><td style="padding:24px 28px 0">
      <div style="font-size:14px;color:#475569">Hello${recipientName ? ` ${escapeHtml(recipientName)}` : ''},</div>
      <div style="font-size:18px;font-weight:600;color:#0f172a;margin-top:8px;line-height:1.4">${escapeHtml(message)}</div>
    </td></tr>
    <tr><td style="padding:18px 28px 0">
      <div style="font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#64748b;margin-bottom:4px">Ticket details</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e2e8f0">${rows}</table>
    </td></tr>
    ${textBlock('Description', (ticket.description || '').trim() || 'No description', '#198754')}
    ${ticket.resolution?.trim() ? textBlock('Resolution', ticket.resolution.trim(), '#0d6efd') : ''}
    ${button}
    <tr><td style="padding:24px 28px;color:#94a3b8;font-size:12px">This is an automatic message from GLOBAL SERVICE. Please do not reply.</td></tr>
  </table>
</td></tr></table>
</body></html>`
}

/**
 * @param recipientName  name of the person receiving the email
 * @param message        what just happened ("Your ticket ... was created")
 * @param ticket         the full ticket row (with category_name, created_by_name, ...)
 * @param appUrl         optional link to the platform
 */
export function buildTicketEmail({ recipientName, message, ticket, appUrl }) {
  const data = { recipientName, message, ticket, appUrl }
  return {
    subject: `[Ticket #${ticket.id}] ${oneLine(message)}`.slice(0, 200),
    text: buildText(data),
    html: buildHtml(data),
  }
}
