import { Paper, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { FaBeer, FaTrophy } from 'react-icons/fa';
import { GiPodiumWinner, GiPodiumSecond, GiPodiumThird } from 'react-icons/gi';
import type { LeaderboardTableProps } from './types';
import translations from '../../locales/cs/dashboard.leaderboard.json';

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 0:
      return <GiPodiumWinner className="text-yellow-500 text-3xl" />;
    case 1:
      return <GiPodiumSecond className="text-gray-400 text-3xl" />;
    case 2:
      return <GiPodiumThird className="text-amber-700 text-3xl" />;
    default:
      return null;
  }
};

export const LeaderboardTable = ({ participants, title }: LeaderboardTableProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="h-full"
  >
    <Paper className="p-6 bg-background-card dark:bg-background-tertiary shadow-xl rounded-2xl h-full border border-primary/5">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-primary/10 rounded-xl">
          <FaTrophy className="text-2xl text-primary" />
        </div>
        <Typography variant="h5" className="font-bold text-primary">
          {title}
        </Typography>
      </div>
      <div className="overflow-hidden rounded-xl">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="text-left p-4 bg-primary/5 dark:bg-primary/10 border-b-2 border-primary/20 font-bold text-primary dark:text-primary">{translations.table.columns.rank}</th>
              <th className="text-left p-4 bg-primary/5 dark:bg-primary/10 border-b-2 border-primary/20 font-bold text-primary dark:text-primary">{translations.table.columns.name}</th>
              <th className="text-right p-4 bg-primary/5 dark:bg-primary/10 border-b-2 border-primary/20 font-bold text-primary dark:text-primary">{translations.table.columns.beers}</th>
            </tr>
          </thead>
          <tbody>
            {participants.map((participant, index) => (
              <motion.tr
                key={participant.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`${index < 3 ? 'bg-primary/5 dark:bg-primary/10' : ''} hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors`}
              >
                <td className="p-4 flex items-center gap-3">
                  <span className={`font-bold ${index < 3 ? 'text-xl text-primary' : ''}`}>{index + 1}.</span>
                  {getRankIcon(index)}
                </td>
                <td className="p-4">
                  <span className={`font-medium ${index < 3 ? 'text-lg' : ''}`}>{participant.username}</span>
                  {index === 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="inline-block ml-2 px-2 py-1 bg-yellow-500/10 rounded-full"
                    >
                      <span className="text-xs font-bold text-yellow-500">{translations.table.champion}</span>
                    </motion.div>
                  )}
                </td>
                <td className="text-right p-4">
                  <div className="flex items-center justify-end gap-2">
                    <span className={`font-bold ${index < 3 ? 'text-lg text-primary' : ''}`}>{participant.beerCount}</span>
                    <FaBeer className={`${index < 3 ? 'text-xl text-primary' : 'text-primary/50'}`} />
                  </div>
                </td>
              </motion.tr>
            ))}
            {participants.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center p-8 text-text-secondary">
                  {translations.table.noParticipants}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Paper>
  </motion.div>
); 