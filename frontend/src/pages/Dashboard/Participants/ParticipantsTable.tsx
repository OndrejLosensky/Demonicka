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
} from '@mui/material';
import { 
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
} from '@mui/icons-material';
import { FaBeer } from 'react-icons/fa';
import type { ParticipantTableProps } from './types';
import { format } from 'date-fns';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';

export const ParticipantsTable: React.FC<ParticipantTableProps> = ({
  participants,
  onAddBeer,
  onRemoveBeer,
  onDelete,
  showGender = true,
}) => {
  const [menuAnchor, setMenuAnchor] = useState<null | { element: HTMLElement; participant: { id: string; name: string } }>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, participant: { id: string; name: string }) => {
    setMenuAnchor({ element: event.currentTarget, participant });
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
  };

  const handleDeleteClick = () => {
    handleCloseMenu();
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (menuAnchor) {
      onDelete(menuAnchor.participant.id);
    }
    setDeleteDialogOpen(false);
    setMenuAnchor(null);
  };

  return (
    <>
      <TableContainer component={Paper} className="shadow-lg rounded-xl overflow-hidden">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell className="font-bold">Name</TableCell>
              <TableCell align="center" className="font-bold">Beers</TableCell>
              {showGender && <TableCell className="font-bold">Gender</TableCell>}
              <TableCell className="font-bold">Last Beer</TableCell>
              <TableCell align="right" className="font-bold w-[220px]">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {participants.map((participant) => (
              <TableRow 
                key={participant.id}
                className="hover:bg-primary/5 transition-colors"
              >
                <TableCell>
                  <Typography className="font-medium">{participant.name}</Typography>
                </TableCell>
                <TableCell align="center">
                  <div className="flex items-center gap-2 justify-center bg-primary/5 py-2 px-3 rounded-lg inline-flex">
                    <span className="font-bold text-lg text-primary">{participant.beerCount}</span>
                    <FaBeer className="text-primary text-lg" />
                  </div>
                </TableCell>
                {showGender && (
                  <TableCell>
                    <span className="px-2 py-1 rounded-full text-sm bg-primary/10 text-primary font-medium">
                      {participant.gender}
                    </span>
                  </TableCell>
                )}
                <TableCell>
                  {participant.lastBeerTime ? (
                    <Typography variant="body2" className="text-text-secondary">
                      {format(new Date(participant.lastBeerTime), 'PPp')}
                    </Typography>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell align="right">
                  <div className="flex items-center gap-2 justify-end">
                    <Tooltip title="Remove Beer">
                      <span>
                        <IconButton
                          size="medium"
                          onClick={() => onRemoveBeer(participant.id)}
                          disabled={participant.beerCount === 0}
                          className={`hover:bg-primary/10 border-2 ${participant.beerCount === 0 ? 'border-gray-200' : 'border-primary/20 hover:border-primary'}`}
                        >
                          <RemoveIcon className={participant.beerCount === 0 ? 'text-gray-300' : 'text-primary'} />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Add Beer">
                      <IconButton
                        size="medium"
                        onClick={() => onAddBeer(participant.id)}
                        className="bg-primary hover:bg-primary/90 text-white"
                      >
                        <AddIcon />
                      </IconButton>
                    </Tooltip>
                    <IconButton
                      onClick={(e) => handleOpenMenu(e, { id: participant.id, name: participant.name })}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </div>
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
        <MenuItem onClick={handleDeleteClick} className="text-red-500">
          <ListItemIcon>
            <DeleteIcon fontSize="small" className="text-red-500" />
          </ListItemIcon>
          <ListItemText>Delete Participant</ListItemText>
        </MenuItem>
      </Menu>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        participantName={menuAnchor?.participant.name || ''}
      />
    </>
  );
}; 