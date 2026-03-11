import { useEffect, useState } from 'react';
import { landingApi } from '../../api/landing';
import type { PublicStats } from '../../types/public';
import { usePageTitle } from '../../hooks/usePageTitle';
import { LandingHero } from './LandingHero';
import { LandingStatsStrip } from './LandingStatsStrip';
import { LandingProduct } from './LandingProduct';
import { LandingIos } from './LandingIos';
import { LandingFooter } from './LandingFooter';

export default function Landing() {
  usePageTitle();
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await landingApi.getStats(undefined);
        if (!cancelled) setStats(data);
      } catch (err) {
        if (!cancelled) setStats(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchStats();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <LandingHero />
      <LandingStatsStrip stats={stats} loading={loading} />
      <LandingProduct />
      <LandingIos />
      <LandingFooter />
    </div>
  );
}
