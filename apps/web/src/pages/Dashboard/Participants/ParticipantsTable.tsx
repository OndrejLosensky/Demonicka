import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Chip,
  Box,
} from '@mui/material';
import { 
  Delete as DeleteIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Male as MaleIcon,
  Female as FemaleIcon,
} from '@mui/icons-material';
import { FaBeer } from 'react-icons/fa';
import type { ParticipantTableProps } from './types';
import { format } from 'date-fns';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import translations from '../../../locales/cs/dashboard.participants.json';

export const ParticipantsTable: React.FC<ParticipantTableProps> = ({
  participants,
  deletedParticipants,
  showDeleted,
  onAddBeer,
  onRemoveBeer,
  onDelete,
}) => {
  const [menuAnchor, setMenuAnchor] = useState<null | { element: HTMLElement; participant: { id: string; username: string } }>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<{ id: string; username: string } | null>(null);

  const handleCloseMenu = () => {
    setMenuAnchor(null);
  };

  const handleDeleteClick = () => {
    if (menuAnchor?.participant) {
      setSelectedParticipant(menuAnchor.participant);
    }
    handleCloseMenu();
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedParticipant) {
      onDelete(selectedParticipant.id);
    }
    setDeleteDialogOpen(false);
    setSelectedParticipant(null);
  };

  const allParticipants = showDeleted ? [...participants, ...deletedParticipants] : participants;

  return (
    <>
      <TableContainer component={Paper} sx={{ borderRadius: 2, overflowX: 'auto' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell>{translations.table.columns.name}</TableCell>
              <TableCell align="center">{translations.table.columns.beers}</TableCell>
              <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{translations.table.columns.gender}</TableCell>
              <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{translations.table.columns.lastBeer}</TableCell>
              <TableCell align="right" sx={{ width: { xs: 120, sm: 180, md: 220 } }}>{translations.table.columns.actions}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {allParticipants.map((participant) => (
              <TableRow 
                key={participant.id}
                sx={{
                  opacity: participant.deletedAt ? 0.5 : 1,
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <TableCell>
                  <Typography sx={{ fontWeight: 500 }}>{participant.username}</Typography>
                  {showDeleted && participant.deletedAt && (
                    <Chip
                      label={translations.table.status.deleted}
                      color="error"
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  )}
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: 1,
                  }}>
                    <FaBeer style={{ color: 'rgba(0, 0, 0, 0.6)' }} />
                    <Typography>{participant.eventBeerCount || 0}</Typography>
                  </Box>
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                  <Chip
                    icon={participant.gender === 'MALE' ? <MaleIcon /> : <FemaleIcon />}
                    label={participant.gender === 'MALE' ? translations.dialogs.add.fields.gender.male : translations.dialogs.add.fields.gender.female}
                    size="small"
                    sx={{
                      bgcolor: participant.gender === 'MALE' ? 'rgba(25, 118, 210, 0.08)' : 'rgba(255, 192, 203, 0.2)',
                      color: participant.gender === 'MALE' ? 'primary.main' : '#E91E63',
                      '& .MuiChip-icon': {
                        color: participant.gender === 'MALE' ? 'primary.main' : '#E91E63',
                      },
                    }}
                  />
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                  {participant.lastBeerTime ? (
                    <Typography variant="body2" color="text.secondary">
                      {format(new Date(participant.lastBeerTime), 'HH:mm')}
                    </Typography>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell align="right">
                  {!participant.deletedAt && (
                    <>
                      <Tooltip title={translations.table.actions.removeBeer}>
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => onRemoveBeer(participant.id)}
                            disabled={(participant.eventBeerCount ?? participant.beerCount) === 0}
                            sx={{
                              mr: { xs: 0.5, sm: 1 },
                              border: 1,
                              borderColor: (participant.eventBeerCount ?? participant.beerCount) === 0 ? 'grey.300' : 'primary.main',
                              '&:hover': {
                                bgcolor: 'primary.light',
                              },
                            }}
                          >
                            <RemoveIcon fontSize="small" color={(participant.eventBeerCount ?? participant.beerCount) === 0 ? 'disabled' : 'primary'} />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title={translations.table.actions.addBeer}>
                        <IconButton
                          size="small"
                          onClick={() => onAddBeer(participant.id)}
                          sx={{
                            mr: { xs: 0.5, sm: 1 },
                            bgcolor: 'primary.main',
                            color: 'white',
                            '&:hover': {
                              bgcolor: 'primary.dark',
                            },
                          }}
                        >
                          <AddIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={translations.table.actions.delete}>
                        <IconButton
                          size="small"
                          onClick={(e) => setMenuAnchor({ 
                            element: e.currentTarget, 
                            participant: { 
                              id: participant.id, 
                              username: participant.username 
                            } 
                          })}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Menu
        anchorEl={menuAnchor?.element}
        open={Boolean(menuAnchor)}
        onClose={handleCloseMenu}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>{translations.table.actions.delete}</ListItemText>
        </MenuItem>
      </Menu>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        participantUsername={selectedParticipant?.username || ''}
      />
    </>
  );
}; 