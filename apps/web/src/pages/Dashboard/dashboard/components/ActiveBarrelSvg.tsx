import { Box, Typography } from '@demonicka/ui';
import { Card } from '@mui/material';
import { Link } from 'react-router-dom';
import { ChevronRight } from '@mui/icons-material';
import type { Barrel, BarrelPrediction } from '@demonicka/shared-types';

type Props = {
  barrel?: Barrel;
  prediction?: BarrelPrediction;
};

function formatEta(asOfIso: string, emptyAtIso: string): { relative: string; absolute: string } {
  const asOf = new Date(asOfIso).getTime();
  const emptyAt = new Date(emptyAtIso).getTime();
  const diffMs = Math.max(0, emptyAt - asOf);
  const totalMinutes = Math.round(diffMs / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const relative = h > 0 ? `${h} h ${m} min` : `${m} min`;
  const d = new Date(emptyAtIso);
  const absolute = `${d.getHours().toString().padStart(2, '0')}:${d
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;
  return { relative, absolute };
}

export function ActiveBarrelSvg({ barrel, prediction }: Props) {
  if (!barrel) {
    return (
      <Card sx={{ borderRadius: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
            Aktivní sud
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Není aktivní žádný sud.
          </Typography>
          <Box sx={{ mt: 2, opacity: 0.75 }}>
            <svg viewBox="0 0 240 220" width="100%" height="220" aria-hidden="true">
              <rect x="60" y="20" width="120" height="180" rx="22" fill="currentColor" opacity="0.06" />
              <rect x="76" y="32" width="88" height="156" rx="16" fill="currentColor" opacity="0.06" />
            </svg>
          </Box>
        </Box>
      </Card>
    );
  }

  const total = Math.max(0, barrel.totalBeers || 0);
  const remaining = Math.max(0, barrel.remainingBeers || 0);
  const pct = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 0;

  // SVG dimensions
  const W = 240;
  const H = 220;
  const barrelX = 62;
  const barrelY = 22;
  const barrelW = 116;
  const barrelH = 176;
  const innerPad = 10;
  const innerX = barrelX + innerPad;
  const innerY = barrelY + innerPad;
  const innerW = barrelW - innerPad * 2;
  const innerH = barrelH - innerPad * 2;

  // Fill height based on remaining
  const fillH = innerH * pct;
  const fillY = innerY + (innerH - fillH);

  const pctLabel = total > 0 ? `${Math.round(pct * 100)}%` : '—';
  const effectivePrediction =
    prediction && prediction.barrel.id === barrel.id ? prediction : undefined;

  const currentEta = effectivePrediction?.eta?.emptyAtByCurrent
    ? formatEta(effectivePrediction.asOf, effectivePrediction.eta.emptyAtByCurrent)
    : null;
  const historicalEta = effectivePrediction?.eta?.emptyAtByHistorical
    ? formatEta(
        effectivePrediction.asOf,
        effectivePrediction.eta.emptyAtByHistorical,
      )
    : null;

  const titleContent = barrel ? (
    <Link 
      to={`/dashboard/barrel/${barrel.id}`}
      style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
    >
      <Typography 
        variant="subtitle1" 
        sx={{ 
          fontWeight: 800,
          color: 'text.primary',
          '&:hover': {
            color: 'primary.main',
          },
        }}
      >
        Aktivní sud
      </Typography>
      <ChevronRight sx={{ fontSize: '1.2rem', color: 'text.secondary' }} />
    </Link>
  ) : (
    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
      Aktivní sud
    </Typography>
  );

  return (
    <Card sx={{ borderRadius: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 2, mb: 1 }}>
          {titleContent}
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
            {pctLabel}
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Sud #{barrel.orderNumber ?? '—'} · {barrel.size ?? '—'}L
        </Typography>

        <Box sx={{ width: '100%', height: 240 }}>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            width="100%"
            height="100%"
            role="img"
            aria-label={`Aktivní sud, zbývá ${remaining} z ${total} piv (${pctLabel})`}
          >
            <defs>
              <linearGradient id="beerGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.95" />
                <stop offset="55%" stopColor="#f59e0b" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#d97706" stopOpacity="0.95" />
              </linearGradient>

              <linearGradient id="barrelShine" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.06" />
                <stop offset="35%" stopColor="#ffffff" stopOpacity="0.02" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0.08" />
              </linearGradient>

              <clipPath id="innerClip">
                <rect x={innerX} y={innerY} width={innerW} height={innerH} rx={18} />
              </clipPath>
            </defs>

            {/* Barrel outer */}
            <rect
              x={barrelX}
              y={barrelY}
              width={barrelW}
              height={barrelH}
              rx={26}
              fill="currentColor"
              opacity="0.08"
            />
            <rect
              x={barrelX}
              y={barrelY}
              width={barrelW}
              height={barrelH}
              rx={26}
              fill="url(#barrelShine)"
            />

            {/* Inner cavity */}
            <rect x={innerX} y={innerY} width={innerW} height={innerH} rx={18} fill="currentColor" opacity="0.06" />

            {/* Beer fill (clipped) */}
            <g clipPath="url(#innerClip)">
              <rect
                x={innerX}
                y={fillY}
                width={innerW}
                height={fillH}
                fill="url(#beerGradient)"
                style={{ transition: 'all 600ms ease' }}
              />

              {/* Foam line */}
              <rect
                x={innerX}
                y={Math.max(innerY, fillY - 6)}
                width={innerW}
                height={8}
                fill="#fff"
                opacity={pct > 0 ? 0.25 : 0}
                style={{ transition: 'all 600ms ease' }}
              />
            </g>

            {/* Hoops */}
            {[52, 110, 168].map((y) => (
              <g key={y}>
                <rect x={barrelX + 6} y={y} width={barrelW - 12} height={10} rx={5} fill="currentColor" opacity="0.12" />
                <rect x={barrelX + 6} y={y} width={barrelW - 12} height={10} rx={5} fill="#000" opacity="0.06" />
              </g>
            ))}

            {/* Text */}
            <text x={W / 2} y={98} textAnchor="middle" fill="currentColor" opacity="0.9" fontSize="34" fontWeight="800">
              {remaining}
            </text>
            <text x={W / 2} y={124} textAnchor="middle" fill="currentColor" opacity="0.55" fontSize="14" fontWeight="600">
              z {total} piv
            </text>
          </svg>
        </Box>

        <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Bude prázdný za:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 800 }}>
              {currentEta
                ? `${currentEta.relative} (${currentEta.absolute})`
                : effectivePrediction?.status === 'warming_up'
                  ? 'Sbírám data…'
                  : '—'}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Bude prázdný za (historicky):
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 800 }}>
              {historicalEta
                ? `${historicalEta.relative} (${historicalEta.absolute})`
                : '—'}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Card>
  );
}

