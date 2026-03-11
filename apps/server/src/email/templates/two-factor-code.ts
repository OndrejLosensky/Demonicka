import { wrapContent } from './layout';

export const twoFactorCodeTemplate = {
  subject: 'Váš kód pro dvoufázové ověření',
  getBody(code: string): string {
    const content = `
    <h2 style="color: #2c3e50; margin-top: 0;">Kód pro dvoufázové ověření</h2>

    <p>Váš kód pro přihlášení je:</p>

    <div style="background-color: #f8f9fa; border: 2px dashed #007bff; border-radius: 5px; padding: 20px; text-align: center; margin: 20px 0;">
      <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #007bff; font-family: 'Courier New', monospace;">
        ${code}
      </span>
    </div>

    <p style="color: #666; font-size: 14px;">
      Tento kód je platný po dobu 10 minut. Pokud jste o tento kód nepožádali, ignorujte tento email.
    </p>
    `;
    return wrapContent(content);
  },
};
