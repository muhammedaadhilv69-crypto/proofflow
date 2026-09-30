type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

type EmailResult = {
  sent: boolean;
  error?: string;
};

export async function sendEmail(message: EmailMessage): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) return { sent: false };

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
    });

    if (!response.ok)
      return { sent: false, error: "Email provider rejected the message" };
    return { sent: true };
  } catch {
    return { sent: false, error: "Email provider could not be reached" };
  }
}

export async function sendReviewReadyEmail(input: {
  to: string;
  clientName: string;
  workspaceName: string;
  projectName: string;
  deliverableName: string;
  versionNumber: number;
  reviewUrl: string;
}) {
  const subject = `${input.projectName} — ${input.deliverableName} v${input.versionNumber} is ready for review`;
  const text = `Hi ${input.clientName},\n\nWe've uploaded a new version of ${input.deliverableName} for your review.\n\nReview it here: ${input.reviewUrl}\n\nThanks,\n${input.workspaceName}`;
  const html = `<p>Hi ${escapeHtml(input.clientName)},</p><p>We've uploaded a new version of <strong>${escapeHtml(input.deliverableName)}</strong> for your review.</p><p><a href="${escapeHtml(input.reviewUrl)}">Review ${escapeHtml(input.deliverableName)}</a></p><p>Thanks,<br>${escapeHtml(input.workspaceName)}</p>`;
  return sendEmail({ to: input.to, subject, text, html });
}

export async function sendAgencyNotificationEmail(input: {
  to: string;
  subject: string;
  message: string;
  projectName: string;
  deliverableName: string;
  actionUrl: string;
}) {
  const text = `${input.message}\n\n${input.projectName} — ${input.deliverableName}\n${input.actionUrl}`;
  const html = `<p>${escapeHtml(input.message)}</p><p><strong>${escapeHtml(input.projectName)}</strong> — ${escapeHtml(input.deliverableName)}</p><p><a href="${escapeHtml(input.actionUrl)}">Open ProofFlow</a></p>`;
  return sendEmail({ to: input.to, subject: input.subject, text, html });
}

export async function sendWorkspaceInviteEmail(input: {
  to: string;
  inviterName: string;
  workspaceName: string;
  inviteUrl: string;
}) {
  const subject = `${input.inviterName} invited you to ${input.workspaceName} on ProofFlow`;
  const text = `${input.inviterName} invited you to join ${input.workspaceName} on ProofFlow.\n\nAccept the invitation: ${input.inviteUrl}\n\nIf you were not expecting this, you can ignore this email.`;
  const html = `<p>${escapeHtml(input.inviterName)} invited you to join <strong>${escapeHtml(input.workspaceName)}</strong> on ProofFlow.</p><p><a href="${escapeHtml(input.inviteUrl)}">Accept the invitation</a></p><p style="color:#64748b;font-size:13px">If you were not expecting this, you can ignore this email.</p>`;
  return sendEmail({ to: input.to, subject, text, html });
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>'"]/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        character
      ] ?? character,
  );
}
