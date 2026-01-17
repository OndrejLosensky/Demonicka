import React, { useMemo } from 'react';
import { Box, Paper, Typography, Chip } from '@demonicka/ui';
import type { BeerPongGame, BeerPongRound, BeerPongGameStatus } from '@demonicka/shared-types';

interface BracketSVGProps {
  games: BeerPongGame[];
  onGameClick: (game: BeerPongGame) => void;
}

interface GamePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

const GAME_WIDTH = 200;
const GAME_HEIGHT = 80;
const HORIZONTAL_SPACING = 250;
const VERTICAL_SPACING = 150;
const SIDE_MARGIN = 100;
const TOP_MARGIN = 50;

export const BracketSVG: React.FC<BracketSVGProps> = ({ games, onGameClick }) => {
  // Organize games by round
  const gamesByRound = useMemo(() => {
    const quarters = games.filter((g) => g.round === 'QUARTERFINAL').sort((a, b) => 
      a.createdAt.localeCompare(b.createdAt)
    );
    const semis = games.filter((g) => g.round === 'SEMIFINAL').sort((a, b) => 
      a.createdAt.localeCompare(b.createdAt)
    );
    const final = games.filter((g) => g.round === 'FINAL')[0];

    return { quarters, semis, final };
  }, [games]);

  // Calculate positions for each game
  const gamePositions = useMemo<Map<string, GamePosition>>(() => {
    const positions = new Map<string, GamePosition>();

    // Quarterfinal positions (top row, 4 games)
    gamesByRound.quarters.forEach((game, index) => {
      positions.set(game.id, {
        x: SIDE_MARGIN + index * HORIZONTAL_SPACING,
        y: TOP_MARGIN,
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
      });
    });

    // Semifinal positions (middle row, 2 games)
    gamesByRound.semis.forEach((game, index) => {
      positions.set(game.id, {
        x: SIDE_MARGIN + HORIZONTAL_SPACING * 0.5 + index * HORIZONTAL_SPACING * 2,
        y: TOP_MARGIN + VERTICAL_SPACING,
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
      });
    });

    // Final position (bottom row, 1 game)
    if (gamesByRound.final) {
      positions.set(gamesByRound.final.id, {
        x: SIDE_MARGIN + HORIZONTAL_SPACING * 1.5,
        y: TOP_MARGIN + VERTICAL_SPACING * 2,
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
      });
    }

    return positions;
  }, [gamesByRound]);

  // Calculate SVG dimensions
  const svgWidth = useMemo(() => {
    if (gamesByRound.quarters.length === 0) return 800;
    return SIDE_MARGIN * 2 + (gamesByRound.quarters.length - 1) * HORIZONTAL_SPACING + GAME_WIDTH;
  }, [gamesByRound.quarters.length]);

  const svgHeight = useMemo(() => {
    if (gamesByRound.final) return TOP_MARGIN * 2 + VERTICAL_SPACING * 2 + GAME_HEIGHT;
    if (gamesByRound.semis.length > 0) return TOP_MARGIN * 2 + VERTICAL_SPACING + GAME_HEIGHT;
    return TOP_MARGIN * 2 + GAME_HEIGHT;
  }, [gamesByRound]);

  // Helper to get winner connection positions
  const getConnectionPath = (fromGameId: string, toGameId: string, isTeam1: boolean): string => {
    const fromPos = gamePositions.get(fromGameId);
    const toPos = gamePositions.get(toGameId);

    if (!fromPos || !toPos) return '';

    const fromX = fromPos.x + (isTeam1 ? 0 : GAME_WIDTH);
    const fromY = fromPos.y + GAME_HEIGHT / 2;
    const toX = toPos.x + (toPos.x > fromPos.x ? -20 : GAME_WIDTH + 20);
    const toY = toPos.y + (toPos.y > fromY ? 20 : GAME_HEIGHT - 20);

    // Create curved path
    const midX = (fromX + toX) / 2;
    return `M ${fromX} ${fromY} Q ${midX} ${fromY} ${midX} ${toY} T ${toX} ${toY}`;
  };

  // Get game status color
  const getStatusColor = (status: BeerPongGameStatus): string => {
    switch (status) {
      case 'PENDING':
        return '#e0e0e0';
      case 'IN_PROGRESS':
        return '#2196f3';
      case 'COMPLETED':
        return '#4caf50';
      default:
        return '#e0e0e0';
    }
  };

  const getStatusTextColor = (status: BeerPongGameStatus): string => {
    switch (status) {
      case 'PENDING':
        return '#666';
      case 'IN_PROGRESS':
        return '#fff';
      case 'COMPLETED':
        return '#fff';
      default:
        return '#666';
    }
  };

  // Find which game a winner should connect to
  const findNextGame = (winnerGame: BeerPongGame): BeerPongGame | null => {
    if (winnerGame.round === 'QUARTERFINAL') {
      const quarterIndex = gamesByRound.quarters.findIndex((g) => g.id === winnerGame.id);
      if (quarterIndex === -1) return null;
      
      // Quarters 0,1 -> Semi 0; Quarters 2,3 -> Semi 1
      const semiIndex = Math.floor(quarterIndex / 2);
      return gamesByRound.semis[semiIndex] || null;
    }
    if (winnerGame.round === 'SEMIFINAL') {
      return gamesByRound.final || null;
    }
    return null;
  };

  // Determine if winner was team1 or team2 in the source game
  const isWinnerTeam1 = (game: BeerPongGame): boolean => {
    return game.winnerTeamId === game.team1Id;
  };

  // Render game box
  const renderGameBox = (game: BeerPongGame, pos: GamePosition) => {
    const team1Name = game.team1?.name || 'Team 1';
    const team2Name = game.team2?.name || 'Team 2';
    const isWinner1 = game.winnerTeamId === game.team1Id;
    const isWinner2 = game.winnerTeamId === game.team2Id;
    const statusColor = getStatusColor(game.status);
    const textColor = getStatusTextColor(game.status);

    return (
      <g key={game.id} onClick={() => onGameClick(game)} style={{ cursor: 'pointer' }}>
        {/* Game background */}
        <rect
          x={pos.x}
          y={pos.y}
          width={pos.width}
          height={pos.height}
          rx={4}
          fill={statusColor}
          stroke="#999"
          strokeWidth={2}
        />

        {/* Team 1 */}
        <text
          x={pos.x + 10}
          y={pos.y + 25}
          fontSize="12"
          fontWeight={isWinner1 ? 700 : 400}
          fill={textColor}
          style={{ userSelect: 'none' }}
        >
          {team1Name}
        </text>
        {isWinner1 && (
          <text x={pos.x + pos.width - 10} y={pos.y + 25} fontSize="12" fill={textColor} textAnchor="end">
            ✓
          </text>
        )}

        {/* VS line */}
        <line
          x1={pos.x + 10}
          y1={pos.y + 40}
          x2={pos.x + pos.width - 10}
          y2={pos.y + 40}
          stroke={textColor}
          strokeWidth={1}
          opacity={0.3}
        />

        {/* Team 2 */}
        <text
          x={pos.x + 10}
          y={pos.y + 60}
          fontSize="12"
          fontWeight={isWinner2 ? 700 : 400}
          fill={textColor}
          style={{ userSelect: 'none' }}
        >
          {team2Name}
        </text>
        {isWinner2 && (
          <text x={pos.x + pos.width - 10} y={pos.y + 60} fontSize="12" fill={textColor} textAnchor="end">
            ✓
          </text>
        )}

        {/* Round label */}
        <text
          x={pos.x + pos.width / 2}
          y={pos.y - 10}
          fontSize="10"
          fill="#666"
          textAnchor="middle"
          style={{ userSelect: 'none' }}
        >
          {game.round}
        </text>
      </g>
    );
  };

  // Render connection lines (only for completed games with winners)
  const renderConnections = () => {
    const paths: JSX.Element[] = [];

    // Quarterfinal -> Semifinal connections
    gamesByRound.quarters.forEach((quarter) => {
      if (quarter.winnerTeamId) {
        const nextGame = findNextGame(quarter);
        if (nextGame) {
          const isWinner1 = isWinnerTeam1(quarter);
          const path = getConnectionPath(quarter.id, nextGame.id, isWinner1);
          paths.push(
            <path
              key={`${quarter.id}-${nextGame.id}`}
              d={path}
              fill="none"
              stroke="#4caf50"
              strokeWidth={3}
              strokeDasharray="5,5"
              opacity={0.6}
            />,
          );
        }
      }
    });

    // Semifinal -> Final connections
    gamesByRound.semis.forEach((semi) => {
      if (semi.winnerTeamId && gamesByRound.final) {
        const isWinner1 = isWinnerTeam1(semi);
        const path = getConnectionPath(semi.id, gamesByRound.final.id, isWinner1);
        paths.push(
          <path
            key={`${semi.id}-${gamesByRound.final.id}`}
            d={path}
            fill="none"
            stroke="#4caf50"
            strokeWidth={3}
            strokeDasharray="5,5"
            opacity={0.6}
          />,
        );
      }
    });

    return paths;
  };

  if (games.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No games in bracket yet
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', overflowX: 'auto', p: 2 }}>
      <svg width={svgWidth} height={svgHeight} style={{ minWidth: '100%' }}>
        {/* Render connection lines first (behind games) */}
        {renderConnections()}

        {/* Render game boxes */}
        {Array.from(gamePositions.entries()).map(([gameId, pos]) => {
          const game = games.find((g) => g.id === gameId);
          if (!game) return null;
          return renderGameBox(game, pos);
        })}
      </svg>
    </Box>
  );
};
