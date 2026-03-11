import { wrapContent } from './layout';

export const passwordResetTemplate = {
  subject: 'Obnovení hesla',
  getBody(code: string, resetLink: string): string {
    const content = `
    <h2 style="color: #2c3e50; margin-top: 0;">Obnovení hesla</h2>

    <p>Požádali jste o obnovení hesla. Váš kód je:</p>

    <div style="background-color: #f8f9fa; border: 2px dashed #007bff; border-radius: 5px; padding: 20px; text-align: center; margin: 20px 0;">
      <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #007bff; font-family: 'Courier New', monospace;">
        ${code}
      </span>
    </div>

    <p style="margin: 24px 0;">
      <a href="${resetLink}" style="display: inline-block; background-color: #dc2626; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600;">Nastavit nové heslo</a>
    </p>

    <p style="color: #666; font-size: 14px;">
      Tento kód je platný 30 minut. Odkaz výše vás zavede na stránku pro zadání kódu a nového hesla. Pokud jste o obnovení hesla nepožádali, ignorujte tento email.
    </p>
    `;
    return wrapContent(content);
  },
};
