import { wrapContent } from './layout';

export const passwordChangedTemplate = {
  subject: 'Heslo bylo změněno',
  getBody(): string {
    const content = `
    <h2 style="color: #2c3e50; margin-top: 0;">Heslo bylo změněno</h2>

    <p>Vaše heslo bylo úspěšně změněno.</p>

    <p style="color: #666; font-size: 14px;">
      Pokud jste tuto změnu neprovedli, kontaktujte nás co nejdříve.
    </p>
    `;
    return wrapContent(content);
  },
};
