/**
 * Loads all locale JSONs via Vite glob. Call from a file that can use import.meta.glob
 * with paths relative to this file. So this file must live under src (e.g. src/translations/load.ts).
 */

const csGlob = import.meta.glob('../locales/cs/*.json');
const enGlob = import.meta.glob('../locales/en/*.json');

function namespaceFromPath(path: string): string {
  const name = path.replace(/.*\//, '').replace(/\.json$/, '');
  return name;
}

async function loadLocale(
  glob: Record<string, () => Promise<{ default: Record<string, unknown> }>>,
): Promise<Record<string, Record<string, unknown>>> {
  const entries = await Promise.all(
    Object.entries(glob).map(async ([path, loader]) => {
      const mod = await loader();
      return [namespaceFromPath(path), mod.default ?? {}] as const;
    }),
  );
  return Object.fromEntries(entries);
}

export async function loadAllTranslations(): Promise<{
  cs: Record<string, Record<string, unknown>>;
  en: Record<string, Record<string, unknown>>;
}> {
  const [cs, en] = await Promise.all([
    loadLocale(csGlob as Record<string, () => Promise<{ default: Record<string, unknown> }>>),
    loadLocale(enGlob as Record<string, () => Promise<{ default: Record<string, unknown> }>>),
  ]);
  return { cs, en };
}
