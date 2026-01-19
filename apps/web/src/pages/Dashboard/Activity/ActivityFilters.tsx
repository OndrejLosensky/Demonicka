import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  type SelectChangeEvent,
} from '@demonicka/ui';
import { FormControlLabel, Switch } from '@mui/material';
import type { ActivityEventType } from './activity.types';
import { ACTIVITY_EVENTS } from './activity.constants';
import { getActivityEventLabel } from './activity.presentation';

export function ActivityFilters({
  value,
  onChange,
  level,
  onLevelChange,
  date,
  onDateChange,
  search,
  onSearchChange,
  autoRefresh,
  onAutoRefreshChange,
  onRefresh,
}: {
  value: ActivityEventType | '';
  onChange: (value: ActivityEventType | '') => void;
  level: string;
  onLevelChange: (value: string) => void;
  date: string;
  onDateChange: (value: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  autoRefresh: boolean;
  onAutoRefreshChange: (value: boolean) => void;
  onRefresh: () => void;
}) {
  const handleChange = (event: SelectChangeEvent<string>) => {
    onChange(event.target.value as ActivityEventType | '');
  };

  const handleLevelChange = (event: SelectChangeEvent<string>) => {
    onLevelChange(event.target.value);
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Box
        sx={{
          display: 'flex',
          gap: 1.5,
          flexWrap: 'wrap',
          alignItems: 'center',
          mb: 1.25,
        }}
      >
        <FormControl
          size="small"
          sx={{
            minWidth: 200,
            '& .MuiOutlinedInput-root': { borderRadius: 1 },
          }}
        >
          <InputLabel id="event-select-label">Typ události</InputLabel>
          <Select
            labelId="event-select-label"
            value={value}
            label="Typ události"
            onChange={handleChange}
          >
            <MenuItem value="">Všechny</MenuItem>
            {ACTIVITY_EVENTS.map((event) => (
              <MenuItem key={event} value={event}>
                {getActivityEventLabel(event)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl
          size="small"
          sx={{
            width: 140,
            '& .MuiOutlinedInput-root': { borderRadius: 1 },
          }}
        >
          <InputLabel id="level-select-label">Level</InputLabel>
          <Select
            labelId="level-select-label"
            value={level}
            label="Level"
            onChange={handleLevelChange}
          >
            <MenuItem value="">Vše</MenuItem>
            <MenuItem value="info">info</MenuItem>
            <MenuItem value="warn">warn</MenuItem>
            <MenuItem value="error">error</MenuItem>
            <MenuItem value="debug">debug</MenuItem>
          </Select>
        </FormControl>

        <TextField
          size="small"
          label="Datum"
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{
            width: 170,
            '& .MuiOutlinedInput-root': { borderRadius: 1 },
          }}
        />

        <TextField
          size="small"
          label="Hledat"
          placeholder="Zpráva, událost, uživatel…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          sx={{
            flex: 1,
            minWidth: 240,
            '& .MuiOutlinedInput-root': { borderRadius: 1 },
          }}
        />

        <FormControlLabel
          sx={{ ml: 0 }}
          control={
            <Switch
              checked={autoRefresh}
              onChange={(e) => onAutoRefreshChange(e.target.checked)}
              size="small"
            />
          }
          label={<Typography variant="body2">Auto (5s)</Typography>}
        />

        <Button size="small" variant="outlined" onClick={onRefresh}>
          Obnovit
        </Button>

        <Button size="small" variant="text" onClick={() => onDateChange('')}>
          Všechny dny
        </Button>
      </Box>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', mt: 1 }}
      >
        Kliknutím na řádek zobrazíte detail (raw JSON). Vyhledávání je přes text v logu (server-side).
      </Typography>
    </Box>
  );
}

