const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3001';

const LOGO_SVG = `
<div style="margin: 0 auto 24px; width: 72px; height: 72px;">
  <table cellpadding="0" cellspacing="0" border="0" style="width: 72px; height: 72px; border-collapse: collapse;">
    <tr>
      <td style="width: 72px; height: 72px; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #d946ef 100%); border-radius: 20px; text-align: center; vertical-align: middle;">
        <table cellpadding="0" cellspacing="0" border="0" style="width: 66px; height: 66px; margin: 3px; border-collapse: collapse;">
          <tr>
            <td style="width: 66px; height: 66px; background: #0a0a12; border-radius: 17px; text-align: center; vertical-align: middle;">
              <span style="font-size: 15px; font-weight: 900; color: #a855f7; letter-spacing: 1px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">FZ</span>
              <br/>
              <span style="font-size: 8px; font-weight: 700; color: #6b7280; letter-spacing: 3px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">AUTH</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</div>`;

const HEADER_BAR = `
<div style="height: 4px; background: linear-gradient(90deg, #7c3aed, #a855f7, #d946ef, #a855f7, #7c3aed); border-radius: 14px 14px 0 0; margin: -40px -30px 30px;"></div>`;

function baseTemplate(title: string, subtitle: string, body: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #050510; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <div style="max-width: 520px; margin: 0 auto; padding: 40px 16px;">

    <!-- Outer gradient border -->
    <div style="background: linear-gradient(135deg, #7c3aed, #a855f7, #d946ef); padding: 2px; border-radius: 16px;">

      <!-- Inner dark card -->
      <div style="background: #0a0a12; border-radius: 14px; padding: 40px 30px; text-align: center;">

        ${HEADER_BAR}

        <!-- Logo -->
        ${LOGO_SVG}

        <!-- Title -->
        <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 0 0 8px; letter-spacing: -0.5px;">${title}</h1>
        <p style="color: #6b7280; font-size: 14px; margin: 0 0 28px; line-height: 1.5;">${subtitle}</p>

        <!-- Body content -->
        ${body}

        <!-- Divider -->
        <div style="height: 1px; background: linear-gradient(90deg, transparent, rgba(139,92,246,0.3), transparent); margin: 28px 0 20px;"></div>

        <!-- Disclaimer -->
        <p style="color: #374151; font-size: 11px; margin: 0; line-height: 1.6;">If you didn't expect this email, please ignore it.<br/>Do not forward this email to anyone.</p>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 24px;">
      <p style="color: #4b5563; font-size: 12px; margin: 0 0 4px; font-weight: 600;">FZ AUTH</p>
      <p style="color: #374151; font-size: 10px; margin: 0;">Secure Authentication &amp; Licensing Platform</p>
    </div>

  </div>
</body>
</html>`;
}

function ctaButton(text: string, url: string): string {
  return `
    <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
      <tr>
        <td style="background: linear-gradient(135deg, #7c3aed, #a855f7); border-radius: 12px; padding: 14px 36px; text-align: center;">
          <a href="${url}" style="color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; letter-spacing: 0.3px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">${text}</a>
        </td>
      </tr>
    </table>`;
}

function infoBox(content: string, borderColor: string = 'rgba(139,92,246,0.3)', bgColor: string = 'rgba(139,92,246,0.08)'): string {
  return `
    <div style="background: ${bgColor}; border: 1px solid ${borderColor}; border-radius: 12px; padding: 20px; margin: 0 0 24px; text-align: left;">
      ${content}
    </div>`;
}

export function welcomeEmail(name: string): { subject: string; html: string } {
  const displayName = name || 'there';
  return {
    subject: '🎉 Welcome to FZ AUTH — Your account is ready!',
    html: baseTemplate(
      `Welcome, ${displayName}!`,
      'Your account has been created successfully. You\'re all set to start building.',
      `
        ${infoBox(`
          <p style="color: #e5e7eb; font-size: 13px; font-weight: 700; margin: 0 0 14px; text-transform: uppercase; letter-spacing: 1px; font-size: 10px;">Getting Started</p>
          <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
            <tr>
              <td style="padding: 6px 0; color: #c4b5fd; font-size: 13px;">
                <span style="color: #a855f7; font-weight: 700; margin-right: 8px;">01</span> Create your first application
              </td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #c4b5fd; font-size: 13px; border-top: 1px solid rgba(139,92,246,0.15);">
                <span style="color: #a855f7; font-weight: 700; margin-right: 8px;">02</span> Set up API keys &amp; webhooks
              </td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #c4b5fd; font-size: 13px; border-top: 1px solid rgba(139,92,246,0.15);">
                <span style="color: #a855f7; font-weight: 700; margin-right: 8px;">03</span> Enable Two-Factor Authentication
              </td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #c4b5fd; font-size: 13px; border-top: 1px solid rgba(139,92,246,0.15);">
                <span style="color: #a855f7; font-weight: 700; margin-right: 8px;">04</span> Manage users &amp; licenses
              </td>
            </tr>
          </table>
        `)}
        ${ctaButton('Open Dashboard →', `${BASE_URL}/dashboard`)}
      `
    ),
  };
}

export function resetEmail(resetUrl: string, expiryMinutes: number = 60): { subject: string; html: string } {
  return {
    subject: 'Reset your FZ AUTH password',
    html: baseTemplate(
      'Password Reset',
      'We received a request to reset your password. Click the button below to set a new one.',
      `
        ${ctaButton('Reset My Password', resetUrl)}

        <div style="margin: 24px 0 0;">
          ${infoBox(`
            <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
              <tr>
                <td style="color: #6b7280; font-size: 12px; padding: 4px 0;">Expires in</td>
                <td style="color: #a855f7; font-size: 12px; padding: 4px 0; text-align: right; font-weight: 700;">${expiryMinutes} minutes</td>
              </tr>
              <tr>
                <td style="color: #6b7280; font-size: 12px; padding: 4px 0; border-top: 1px solid rgba(139,92,246,0.15);">One-time use</td>
                <td style="color: #4ade80; font-size: 12px; padding: 4px 0; text-align: right; font-weight: 700; border-top: 1px solid rgba(139,92,246,0.15);">Yes</td>
              </tr>
            </table>
          `)}
        </div>

        <p style="color: #374151; font-size: 11px; margin: 16px 0 0; word-break: break-all;">
          Can't click the button? Copy this link:<br/>
          <a href="${resetUrl}" style="color: #7c3aed; font-size: 11px;">${resetUrl}</a>
        </p>
      `
    ),
  };
}

export function loginAlertEmail(ip: string, location: string | null, time: string): { subject: string; html: string } {
  const loc = location || 'Unknown location';
  return {
    subject: '⚠️ New login detected — FZ AUTH',
    html: baseTemplate(
      'New Login Detected',
      'A new sign-in was detected on your account from an unrecognized source.',
      `
        ${infoBox(`
          <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
            <tr>
              <td style="color: #6b7280; font-size: 13px; padding: 8px 0; width: 100px;">IP Address</td>
              <td style="color: #e5e7eb; font-size: 13px; padding: 8px 0; text-align: right; font-family: 'SF Mono', Monaco, 'Cascadia Mono', monospace; font-weight: 600;">${ip}</td>
            </tr>
            <tr>
              <td style="color: #6b7280; font-size: 13px; padding: 8px 0; border-top: 1px solid rgba(139,92,246,0.15);">Location</td>
              <td style="color: #e5e7eb; font-size: 13px; padding: 8px 0; text-align: right; border-top: 1px solid rgba(139,92,246,0.15);">${loc}</td>
            </tr>
            <tr>
              <td style="color: #6b7280; font-size: 13px; padding: 8px 0; border-top: 1px solid rgba(139,92,246,0.15);">Time</td>
              <td style="color: #e5e7eb; font-size: 13px; padding: 8px 0; text-align: right; border-top: 1px solid rgba(139,92,246,0.15);">${time}</td>
            </tr>
          </table>
        `)}

        ${infoBox(`
          <p style="color: #ef4444; font-size: 13px; font-weight: 700; margin: 0 0 6px;">⚠️ Wasn't you?</p>
          <p style="color: #9ca3af; font-size: 12px; margin: 0; line-height: 1.5;">Change your password immediately and enable 2FA to protect your account.</p>
        `, 'rgba(239,68,68,0.3)', 'rgba(239,68,68,0.06)')}

        ${ctaButton('Review Account Security', `${BASE_URL}/account`)}
      `
    ),
  };
}

export function twoFAEnabledEmail(): { subject: string; html: string } {
  return {
    subject: '✅ Two-Factor Authentication enabled — FZ AUTH',
    html: baseTemplate(
      '2FA Enabled',
      'Two-Factor Authentication is now active on your account.',
      `
        ${infoBox(`
          <div style="text-align: center;">
            <p style="color: #4ade80; font-size: 16px; font-weight: 800; margin: 0 0 6px;">✓ Account Secured</p>
            <p style="color: #9ca3af; font-size: 12px; margin: 0; line-height: 1.5;">You'll need your authenticator app each time you sign in with your email and password.</p>
          </div>
        `, 'rgba(34,197,94,0.3)', 'rgba(34,197,94,0.06)')}

        ${infoBox(`
          <p style="color: #e5e7eb; font-size: 10px; font-weight: 700; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 1px;">Important Reminders</p>
          <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
            <tr>
              <td style="padding: 5px 0; color: #c4b5fd; font-size: 12px;">
                <span style="color: #a855f7;">●</span>&nbsp; Keep your backup codes in a safe place
              </td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #c4b5fd; font-size: 12px;">
                <span style="color: #a855f7;">●</span>&nbsp; Don't share your authenticator secret
              </td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #c4b5fd; font-size: 12px;">
                <span style="color: #a855f7;">●</span>&nbsp; If you lose access, use a backup code to sign in
              </td>
            </tr>
          </table>
        `)}

        ${ctaButton('View Account Settings', `${BASE_URL}/account`)}
      `
    ),
  };
}

export function planExpiryEmail(planName: string, daysLeft: number, expiryDate: string): { subject: string; html: string } {
  const urgency = daysLeft <= 1;
  const borderColor = urgency ? 'rgba(239,68,68,0.4)' : 'rgba(234,179,8,0.4)';
  const bgColor = urgency ? 'rgba(239,68,68,0.06)' : 'rgba(234,179,8,0.06)';
  const statusColor = urgency ? '#ef4444' : '#eab308';

  return {
    subject: `⚠️ Your ${planName} plan expires ${daysLeft <= 1 ? 'tomorrow' : `in ${daysLeft} days`} — FZ AUTH`,
    html: baseTemplate(
      'Plan Expiring Soon',
      `Your ${planName} plan will expire on ${expiryDate}.`,
      `
        ${infoBox(`
          <div style="text-align: center;">
            <p style="color: ${statusColor}; font-size: 36px; font-weight: 900; margin: 0 0 4px;">${daysLeft}</p>
            <p style="color: ${statusColor}; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px;">${daysLeft === 1 ? 'Day Remaining' : 'Days Remaining'}</p>
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">Your <strong style="color: #e5e7eb;">${planName}</strong> plan expires on <strong style="color: #e5e7eb;">${expiryDate}</strong></p>
          </div>
        `, borderColor, bgColor)}

        ${infoBox(`
          <p style="color: #e5e7eb; font-size: 10px; font-weight: 700; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 1px;">What happens when it expires</p>
          <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
            <tr>
              <td style="padding: 5px 0; color: #c4b5fd; font-size: 12px;">
                <span style="color: #a855f7;">●</span>&nbsp; Account downgrades to Free plan
              </td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #c4b5fd; font-size: 12px;">
                <span style="color: #a855f7;">●</span>&nbsp; App limit reduces to 1
              </td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #c4b5fd; font-size: 12px;">
                <span style="color: #a855f7;">●</span>&nbsp; Pro features (webhooks, teams, files) will be locked
              </td>
            </tr>
          </table>
        `)}

        ${ctaButton('Renew Your Plan', `${BASE_URL}/shop`)}
      `
    ),
  };
}
