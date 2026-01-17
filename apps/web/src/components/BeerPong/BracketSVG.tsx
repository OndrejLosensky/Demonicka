import React, { useMemo } from 'react';
import { Box, Typography } from '@demonicka/ui';
import type { BeerPongGame, BeerPongRound, BeerPongGameStatus } from '@demonicka/shared-types';

interface BracketSVGProps {
  games: BeerPongGame[];
  onGameClick: (game: BeerPongGame) => void;
  onSlotClick?: (game: BeerPongGame, position: 'team1' | 'team2') => void;
  canEdit?: boolean; // Whether teams can be assigned to empty slots
}

interface GamePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

const GAME_WIDTH = 200;
const GAME_HEIGHT = 80;
const ROUND_SPACING = 400; // Space between rounds (left to right) - increased for better spacing
const SIDE_MARGIN = 50;
const TOP_MARGIN = 30;
const BOTTOM_MARGIN = 30;

export const BracketSVG: React.FC<BracketSVGProps> = ({ 
  games, 
  onGameClick, 
  onSlotClick,
  canEdit = false,
}) => {
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

  // Calculate positions for each game with even vertical distribution
  const gamePositions = useMemo<Map<string, GamePosition>>(() => {
    const positions = new Map<string, GamePosition>();

    const startY = TOP_MARGIN;
    const spacingBetweenGames = 120; // Space between consecutive games

    // Quarterfinal positions (left column, evenly distributed)
    gamesByRound.quarters.forEach((game, index) => {
      // Evenly space games vertically
      const yPosition = startY + (index * spacingBetweenGames);
      positions.set(game.id, {
        x: SIDE_MARGIN,
        y: yPosition,
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
      });
    });

    // Semifinal positions (middle column, aligned with their source quarterfinals)
    gamesByRound.semis.forEach((game, index) => {
      // Each semi should be positioned between the two quarters that feed into it
      const quarter1Index = index * 2;
      const quarter2Index = index * 2 + 1;
      const quarter1Pos = positions.get(gamesByRound.quarters[quarter1Index]?.id);
      const quarter2Pos = positions.get(gamesByRound.quarters[quarter2Index]?.id);
      
      let yPosition = startY;
      if (quarter1Pos && quarter2Pos) {
        // Position between the two quarters
        yPosition = (quarter1Pos.y + quarter2Pos.y + GAME_HEIGHT) / 2 - GAME_HEIGHT / 2;
      } else if (quarter1Pos) {
        yPosition = quarter1Pos.y;
      } else if (quarter2Pos) {
        yPosition = quarter2Pos.y;
      }

      positions.set(game.id, {
        x: SIDE_MARGIN + ROUND_SPACING,
        y: yPosition,
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
      });
    });

    // Final position (right column, centered between the two semis)
    if (gamesByRound.final) {
      const semi1Pos = positions.get(gamesByRound.semis[0]?.id);
      const semi2Pos = positions.get(gamesByRound.semis[1]?.id);
      
      let yPosition = startY;
      if (semi1Pos && semi2Pos) {
        // Position between the two semis
        yPosition = (semi1Pos.y + semi2Pos.y + GAME_HEIGHT) / 2 - GAME_HEIGHT / 2;
      } else if (semi1Pos) {
        yPosition = semi1Pos.y;
      } else if (semi2Pos) {
        yPosition = semi2Pos.y;
      }

      positions.set(gamesByRound.final.id, {
        x: SIDE_MARGIN + ROUND_SPACING * 2,
        y: yPosition,
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
      });
    }

    return positions;
  }, [gamesByRound]);

  // Calculate SVG dimensions
  const svgWidth = useMemo(() => {
    if (gamesByRound.final) return SIDE_MARGIN * 2 + ROUND_SPACING * 2 + GAME_WIDTH;
    if (gamesByRound.semis.length > 0) return SIDE_MARGIN * 2 + ROUND_SPACING + GAME_WIDTH;
    return SIDE_MARGIN * 2 + GAME_WIDTH;
  }, [gamesByRound]);

  const svgHeight = useMemo(() => {
    if (gamesByRound.quarters.length === 0) return 200;
    const spacingBetweenGames = 120;
    const totalHeight = (gamesByRound.quarters.length - 1) * spacingBetweenGames + GAME_HEIGHT;
    return TOP_MARGIN + totalHeight + BOTTOM_MARGIN;
  }, [gamesByRound.quarters.length]);

  // Helper to render bracket-style connection line: straight → corner → down → straight
  const renderConnectionLine = (
    fromGameId: string,
    toGameId: string,
    fromSlotY: number, // Y position of the slot in source game (team1 or team2 center)
    fromGame: BeerPongGame, // Source game to check status
    isWinner: boolean // Whether this slot has the winner
  ): JSX.Element | null => {
    const fromPos = gamePositions.get(fromGameId);
    const toPos = gamePositions.get(toGameId);

    if (!fromPos || !toPos) return null;

    // Line starts from right side of source game at slot Y position
    const fromX = fromPos.x + GAME_WIDTH;
    const fromY = fromSlotY;
    
    // Target position: left side of target game, at its center
    const toX = toPos.x;
    const toY = toPos.y + GAME_HEIGHT / 2;

    // Create bracket-style path: horizontal → corner → vertical → horizontal
    // Center the vertical segment (bend point) between source and target games
    const midX = (fromX + toX) / 2; // Midpoint between source right edge and target left edge
    
    // Create path: M (move to start), H (horizontal line), V (vertical line), H (horizontal line)
    const pathData = `M ${fromX} ${fromY} H ${midX} V ${toY} H ${toX}`;

    // Only show red if game is COMPLETED and this is the winner route
    // Grey for all other cases (empty games, DRAFT status, non-winner routes)
    const isCompletedWinner = fromGame.status === 'COMPLETED' && isWinner;
    const lineColor = isCompletedWinner ? '#d32f2f' : '#999'; // Red only for completed winners, grey otherwise

    return (
      <path
        key={`${fromGameId}-${toGameId}-${fromSlotY}`}
        d={pathData}
        fill="none"
        stroke={lineColor}
        strokeWidth={2}
        strokeDasharray="5,5" // Dashed style: 5px dash, 5px gap
      />
    );
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


  // Render game box
  const renderGameBox = (game: BeerPongGame, pos: GamePosition) => {
    const team1Name = game.team1?.name || null;
    const team2Name = game.team2?.name || null;
    const isTeam1Empty = !game.team1Id;
    const isTeam2Empty = !game.team2Id;
    const isWinner1 = game.winnerTeamId === game.team1Id;
    const isWinner2 = game.winnerTeamId === game.team2Id;
    const statusColor = getStatusColor(game.status);
    const textColor = getStatusTextColor(game.status);
    const isEmpty = isTeam1Empty && isTeam2Empty;

    // Only allow team assignment in QUARTERFINAL round
    const canAssignTeam = canEdit && game.round === 'QUARTERFINAL';
    
    // If game has teams, clicking opens game details. If empty and editable, clicking slot assigns team.
    const handleTeam1Click = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (canAssignTeam && isTeam1Empty && onSlotClick) {
        onSlotClick(game, 'team1');
      } else if (!isTeam1Empty) {
        onGameClick(game);
      }
    };

    const handleTeam2Click = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (canAssignTeam && isTeam2Empty && onSlotClick) {
        onSlotClick(game, 'team2');
      } else if (!isTeam2Empty) {
        onGameClick(game);
      }
    };

    const handleGameClick = () => {
      if (!isEmpty) {
        onGameClick(game);
      }
    };

    return (
      <g key={game.id}>
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
          onClick={handleGameClick}
          style={{ cursor: isEmpty ? 'default' : 'pointer' }}
        />

        {/* Team 1 slot */}
        <g onClick={handleTeam1Click} style={{ cursor: canEdit && isTeam1Empty ? 'pointer' : 'default' }}>
          {isTeam1Empty && canAssignTeam ? (
            <>
              <rect
                x={pos.x + 5}
                y={pos.y + 5}
                width={pos.width - 10}
                height={30}
                rx={2}
                fill="rgba(255, 255, 255, 0.2)"
                stroke="rgba(255, 255, 255, 0.5)"
                strokeWidth={1}
                strokeDasharray="4,4"
              />
              <text
                x={pos.x + pos.width / 2}
                y={pos.y + 25}
                fontSize="11"
                fill={textColor}
                textAnchor="middle"
                style={{ userSelect: 'none', opacity: 0.7 }}
              >
                + Přidat tým
              </text>
            </>
          ) : (
            <>
              <text
                x={pos.x + 10}
                y={pos.y + 25}
                fontSize="13"
                fontWeight={isWinner1 ? 700 : 400}
                fill={textColor}
                style={{ userSelect: 'none' }}
              >
                {team1Name || '—'}
              </text>
              {isWinner1 && team1Name && (
                <text 
                  x={pos.x + pos.width - 10} 
                  y={pos.y + 25} 
                  fontSize="14" 
                  fill={textColor} 
                  textAnchor="end"
                  fontWeight={700}
                >
                  ✓
                </text>
              )}
            </>
          )}
        </g>

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

        {/* Team 2 slot */}
        <g onClick={handleTeam2Click} style={{ cursor: canEdit && isTeam2Empty ? 'pointer' : 'default' }}>
          {isTeam2Empty && canAssignTeam ? (
            <>
              <rect
                x={pos.x + 5}
                y={pos.y + 45}
                width={pos.width - 10}
                height={30}
                rx={2}
                fill="rgba(255, 255, 255, 0.2)"
                stroke="rgba(255, 255, 255, 0.5)"
                strokeWidth={1}
                strokeDasharray="4,4"
              />
              <text
                x={pos.x + pos.width / 2}
                y={pos.y + 65}
                fontSize="11"
                fill={textColor}
                textAnchor="middle"
                style={{ userSelect: 'none', opacity: 0.7 }}
              >
                + Přidat tým
              </text>
            </>
          ) : (
            <>
              <text
                x={pos.x + 10}
                y={pos.y + 60}
                fontSize="13"
                fontWeight={isWinner2 ? 700 : 400}
                fill={textColor}
                style={{ userSelect: 'none' }}
              >
                {team2Name || '—'}
              </text>
              {isWinner2 && team2Name && (
                <text 
                  x={pos.x + pos.width - 10} 
                  y={pos.y + 60} 
                  fontSize="14" 
                  fill={textColor} 
                  textAnchor="end"
                  fontWeight={700}
                >
                  ✓
                </text>
              )}
            </>
          )}
        </g>
      </g>
    );
  };

  // Render connection lines for all games (grey by default, red only for completed winners)
  // Render grey lines first, then red lines on top so winners are always visible
  const renderConnections = () => {
    const greyLines: JSX.Element[] = [];
    const redLines: JSX.Element[] = [];

    // Quarterfinal -> Semifinal connections (both slots connect, winner route is red only if completed)
    gamesByRound.quarters.forEach((quarter) => {
      const nextGame = findNextGame(quarter);
      if (!nextGame) return;

      const quarterPos = gamePositions.get(quarter.id);
      if (!quarterPos) return;

      // Team 1 connection (top slot)
      const team1Y = quarterPos.y + GAME_HEIGHT * 0.25; // Top slot center
      const isWinner1 = quarter.winnerTeamId === quarter.team1Id;
      const isCompletedWinner1 = quarter.status === 'COMPLETED' && isWinner1;
      const line1 = renderConnectionLine(quarter.id, nextGame.id, team1Y, quarter, isWinner1);
      if (line1) {
        if (isCompletedWinner1) {
          redLines.push(line1);
        } else {
          greyLines.push(line1);
        }
      }

      // Team 2 connection (bottom slot)
      const team2Y = quarterPos.y + GAME_HEIGHT * 0.75; // Bottom slot center
      const isWinner2 = quarter.winnerTeamId === quarter.team2Id;
      const isCompletedWinner2 = quarter.status === 'COMPLETED' && isWinner2;
      const line2 = renderConnectionLine(quarter.id, nextGame.id, team2Y, quarter, isWinner2);
      if (line2) {
        if (isCompletedWinner2) {
          redLines.push(line2);
        } else {
          greyLines.push(line2);
        }
      }
    });

    // Semifinal -> Final connections (both slots connect, winner route is red only if completed)
    gamesByRound.semis.forEach((semi) => {
      if (!gamesByRound.final) return;

      const semiPos = gamePositions.get(semi.id);
      if (!semiPos) return;

      // Team 1 connection (top slot)
      const team1Y = semiPos.y + GAME_HEIGHT * 0.25; // Top slot center
      const isWinner1 = semi.winnerTeamId === semi.team1Id;
      const isCompletedWinner1 = semi.status === 'COMPLETED' && isWinner1;
      const line1 = renderConnectionLine(semi.id, gamesByRound.final.id, team1Y, semi, isWinner1);
      if (line1) {
        if (isCompletedWinner1) {
          redLines.push(line1);
        } else {
          greyLines.push(line1);
        }
      }

      // Team 2 connection (bottom slot)
      const team2Y = semiPos.y + GAME_HEIGHT * 0.75; // Bottom slot center
      const isWinner2 = semi.winnerTeamId === semi.team2Id;
      const isCompletedWinner2 = semi.status === 'COMPLETED' && isWinner2;
      const line2 = renderConnectionLine(semi.id, gamesByRound.final.id, team2Y, semi, isWinner2);
      if (line2) {
        if (isCompletedWinner2) {
          redLines.push(line2);
        } else {
          greyLines.push(line2);
        }
      }
    });

    // Return grey lines first, then red lines (red will render on top)
    return [...greyLines, ...redLines];
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
      <svg 
        width={svgWidth} 
        height={svgHeight} 
        style={{ 
          minWidth: '100%',
          display: 'block',
        }}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        preserveAspectRatio="xMidYMid meet"
      >
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
