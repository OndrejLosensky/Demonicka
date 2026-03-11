import packageJson from '../../../package.json';

export function VersionChip() {
  const version = packageJson.version ?? '0.0.0';
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border"
      style={{
        borderColor: 'var(--color-primary-200)',
        color: 'var(--color-primary-700)',
        backgroundColor: 'var(--color-primary-50)',
      }}
    >
      v{version}
    </span>
  );
}
