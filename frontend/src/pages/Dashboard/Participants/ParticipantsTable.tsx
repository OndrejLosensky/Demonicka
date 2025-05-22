import React from 'react';
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
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material';
import type { ParticipantTableProps } from './types';
import { format } from 'date-fns';

export const ParticipantsTable: React.FC<ParticipantTableProps> = ({
  participants,
  onAddBeer,
  onRemoveBeer,
  onDelete,
  showGender = true,
}) => {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            {showGender && <TableCell>Gender</TableCell>}
            <TableCell>Beer Count</TableCell>
            <TableCell>Last Beer</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {participants.map((participant) => (
            <TableRow key={participant.id}>
              <TableCell>{participant.name}</TableCell>
              {showGender && <TableCell>{participant.gender}</TableCell>}
              <TableCell>{participant.beerCount}</TableCell>
              <TableCell>
                {participant.lastBeerTime
                  ? format(new Date(participant.lastBeerTime), 'PPp')
                  : '-'}
              </TableCell>
              <TableCell align="right">
                <Tooltip title="Add Beer">
                  <IconButton
                    color="primary"
                    onClick={() => onAddBeer(participant.id)}
                  >
                    <AddIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Remove Beer">
                  <IconButton
                    color="warning"
                    onClick={() => onRemoveBeer(participant.id)}
                    disabled={participant.beerCount === 0}
                  >
                    <RemoveIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete Participant">
                  <IconButton
                    color="error"
                    onClick={() => onDelete(participant.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}; 