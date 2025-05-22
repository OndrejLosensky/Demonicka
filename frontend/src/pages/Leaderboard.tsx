import { useQuery } from '@tanstack/react-query';
import { Paper, Typography, Grid } from '@mui/material';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface ParticipantLeaderboard {
  id: number;
  name: string;
  beerCount: number;
  gender: 'MALE' | 'FEMALE';
}

interface LeaderboardData {
  males: ParticipantLeaderboard[];
  females: ParticipantLeaderboard[];
}

const LeaderboardTable = ({ participants, title }: { participants: ParticipantLeaderboard[]; title: string }) => (
  <Paper className="p-4">
    <Typography variant="h6" gutterBottom>
      {title}
    </Typography>
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr>
            <th className="text-left p-3 bg-primary/5 dark:bg-primary/10 border-b-2 border-primary/20 font-bold text-primary dark:text-primary">Rank</th>
            <th className="text-left p-3 bg-primary/5 dark:bg-primary/10 border-b-2 border-primary/20 font-bold text-primary dark:text-primary">Name</th>
            <th className="text-right p-3 bg-primary/5 dark:bg-primary/10 border-b-2 border-primary/20 font-bold text-primary dark:text-primary">Beers</th>
          </tr>
        </thead>
        <tbody>
          {participants.map((participant, index) => (
            <tr key={participant.id} className={index < 3 ? 'font-bold' : ''}>
              <td className="p-2">{index + 1}.</td>
              <td className="p-2">{participant.name}</td>
              <td className="text-right p-2">{participant.beerCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </Paper>
);

export default function Leaderboard() {
  const { data: stats, isLoading } = useQuery<LeaderboardData>({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/dashboard/leaderboard`, {
        withCredentials: true
      });
      return data;
    },
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <Typography>Loading leaderboard...</Typography>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6">
        <Typography>No data available.</Typography>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Typography variant="h4" gutterBottom className="text-center mb-8">
        Beer Leaderboard 🍺
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <LeaderboardTable participants={stats.males} title="Men's Leaderboard" />
        </Grid>
        <Grid item xs={12} md={6}>
          <LeaderboardTable participants={stats.females} title="Women's Leaderboard" />
        </Grid>
      </Grid>
    </div>
  );
}
