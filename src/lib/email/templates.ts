// src/lib/email/templates.ts
const baseUrl = process.env.APP_BASE_URL || 'https://gradeidea.cc';

export function welcomeTemplate(opts: { name?: string }) {
  return `
    <div>
      <h1>Welcome to GradeIdea</h1>
      <p>${opts.name ? `Hi ${opts.name},` : 'Hi,'} thanks for signing up.</p>
      <p>Your first scan is free. Validate your first idea here:</p>
      <p><a href="${baseUrl}">${baseUrl}</a></p>
    </div>
  `;
}

export function reportReadyTemplate(opts: { ideaTitle?: string; dashboardPath?: string }) {
  const link = `${baseUrl}${opts.dashboardPath || '/dashboard'}`;
  return `
    <div>
      <h1>Your GradeIdea report is ready</h1>
      <p>${opts.ideaTitle ? `Idea: <strong>${opts.ideaTitle}</strong>` : ''}</p>
      <p>View it here: <a href="${link}">${link}</a></p>
    </div>
  `;
}

export function tokenPurchaseTemplate(opts: { tokensAdded: number }) {
  const link = `${baseUrl}/dashboard`;
  return `
    <div>
      <h1>Tokens added to your account</h1>
      <p>We added <strong>${opts.tokensAdded}</strong> tokens to your account.</p>
      <p><a href="${link}">Start grading ideas</a></p>
    </div>
  `;
}
