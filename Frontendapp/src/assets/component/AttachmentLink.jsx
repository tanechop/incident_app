const API_URL = 'http://localhost:3000'

// Small "paper clip" link to the file attached to a ticket (shows nothing if there is none)
const AttachmentLink = ({ ticket }) => {
  if (!ticket.attachment) return null
  return (
    <a
      href={`${API_URL}/uploads/${ticket.attachment}`}
      target="_blank"
      rel="noreferrer"
      className="small d-inline-block"
    >
      <i className="bi bi-paperclip"></i> {ticket.attachment_name || 'Attachment'}
    </a>
  )
}

export default AttachmentLink
