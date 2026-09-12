import nodemailer from 'nodemailer';

const SMTP_EMAIL = process.env.SMTP_EMAIL || '';
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || '';
const SENDER_NAME = 'FZ AUTH';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: SMTP_EMAIL, pass: SMTP_PASSWORD },
});

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/td>/gi, ' ')
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x2022;/g, '•')
    .replace(/&mdash;/g, '—')
    .replace(/&copy;/g, '©')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const text = stripHtml(opts.html);

  await transporter.sendMail({
    from: `"${SENDER_NAME}" <${SMTP_EMAIL}>`,
    to: opts.to,
    subject: opts.subject,
    text,
    html: opts.html,
  });
}
