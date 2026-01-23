import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  Input,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Box,
  Typography,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  Paper,
  TextField,
} from '@demonicka/ui';
import { eventRegistrationService, type CreateRegistrationDto } from '../../services/eventRegistrationService';
import {
  getArrivalTimeSlots,
  getLeaveTimeSlots,
  timeSlotToDateTime,
  type TimeSlot,
  type TimeSlotOption,
} from '../../utils/timeBlocking';
import { useAppTheme } from '../../contexts/ThemeContext';

type StepIndex = 0 | 1 | 2 | 3;

const STEPS = ['Jméno a účast', 'Čas příjezdu', 'Čas odjezdu', 'Dokončení'] as const;

export function RegisterEventByToken() {
  const { token } = useParams<{ token: string }>();
  const { setMode } = useAppTheme();

  // Force light mode for public registration page
  useEffect(() => {
    setMode('light', { persistToServer: false });
    // Restore previous mode when component unmounts
    return () => {
      const stored = localStorage.getItem('app_theme');
      if (stored === 'light' || stored === 'dark') {
        setMode(stored, { persistToServer: false });
      }
    };
  }, [setMode]);

  const [activeStep, setActiveStep] = useState<StepIndex>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [eventName, setEventName] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [rawName, setRawName] = useState('');
  const [participating, setParticipating] = useState<boolean | null>(null);
  
  // Arrival time selection
  const [arrivalDate, setArrivalDate] = useState<string>('');
  const [arrivalSlot, setArrivalSlot] = useState<TimeSlot | ''>('');
  const [arrivalManualTime, setArrivalManualTime] = useState<string>('');
  
  // Leave time selection
  const [leaveDate, setLeaveDate] = useState<string>('');
  const [leaveSlot, setLeaveSlot] = useState<TimeSlot | ''>('');
  const [leaveManualTime, setLeaveManualTime] = useState<string>('');

  useEffect(() => {
    if (!token) {
      toast.error('Neplatný odkaz');
      return;
    }

    const loadEvent = async () => {
      try {
        setIsLoading(true);
        const info = await eventRegistrationService.getEventByToken(token);
        setEventName(info.eventName);
        setStartDate(info.startDate);
        setEndDate(info.endDate);
      } catch (error: any) {
        console.error('Error loading event:', error);
        if (error.response?.status === 404) {
          toast.error('Neplatný registrační odkaz');
        } else if (error.response?.status === 403) {
          toast.error('Registrace je momentálně uzavřena');
        } else {
          toast.error('Nepodařilo se načíst informace o události');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadEvent();
  }, [token]);

  const arrivalSlots = startDate ? getArrivalTimeSlots(startDate) : [];
  const leaveSlots = endDate ? getLeaveTimeSlots(endDate) : [];

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawName.trim()) {
      toast.error('Jméno je povinné');
      return;
    }

    if (participating === null) {
      toast.error('Prosím vyberte, zda se zúčastníte');
      return;
    }

    if (!participating) {
      // Submit immediately if not participating
      await submitRegistration({
        rawName: rawName.trim(),
        participating: false,
      });
      return;
    }

    // Move to arrival time step
    setActiveStep(1);
  };

  const handleArrivalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!arrivalDate || !arrivalSlot) {
      toast.error('Prosím vyberte datum a čas příjezdu');
      return;
    }
    setActiveStep(2);
  };

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveDate || !leaveSlot) {
      toast.error('Prosím vyberte datum a čas odjezdu');
      return;
    }

    // Convert slots to DateTime
    const arrivalDateTime = timeSlotToDateTime(arrivalDate, arrivalSlot as TimeSlot, arrivalManualTime || undefined);
    const leaveDateTime = timeSlotToDateTime(leaveDate, leaveSlot as TimeSlot, leaveManualTime || undefined);

    if (arrivalDateTime >= leaveDateTime) {
      toast.error('Čas příjezdu musí být před časem odjezdu');
      return;
    }

    await submitRegistration({
      rawName: rawName.trim(),
      participating: true,
      arrivalTime: arrivalDateTime.toISOString(),
      leaveTime: leaveDateTime.toISOString(),
    });
  };

  const submitRegistration = async (data: CreateRegistrationDto) => {
    if (!token) return;

    try {
      setIsLoading(true);
      await eventRegistrationService.createRegistration(token, data);
      setActiveStep(3);
      toast.success('Registrace byla úspěšně odeslána!');
    } catch (error: any) {
      console.error('Error submitting registration:', error);
      if (error.response?.status === 403) {
        toast.error('Registrace je momentálně uzavřena');
      } else {
        toast.error('Nepodařilo se odeslat registraci');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderTimeSlotSelection = (
    slots: TimeSlotOption[],
    selectedDate: string,
    selectedSlot: TimeSlot | '',
    onDateChange: (date: string) => void,
    onSlotChange: (slot: TimeSlot) => void,
    manualTime: string,
    onManualTimeChange: (time: string) => void,
  ) => {
    // Group slots by date
    const slotsByDate = slots.reduce((acc, slot) => {
      if (!acc[slot.dateString]) {
        acc[slot.dateString] = [];
      }
      acc[slot.dateString].push(slot);
      return acc;
    }, {} as Record<string, TimeSlotOption[]>);

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Horizontal layout for dates */}
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, flexWrap: 'wrap' }}>
          {Object.entries(slotsByDate).map(([dateString, dateSlots]) => (
            <Box 
              key={dateString}
              sx={{ 
                flex: '1 1 auto',
                minWidth: { xs: '100%', sm: '200px' },
                maxWidth: { sm: '300px' },
              }}
            >
              <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
                {dateSlots[0].displayDate}
              </Typography>
              <FormControl component="fieldset" fullWidth>
                <RadioGroup
                  value={selectedDate === dateString ? selectedSlot : ''}
                  onChange={(e) => {
                    onDateChange(dateString);
                    onSlotChange(e.target.value as TimeSlot);
                  }}
                  sx={{ display: 'flex', flexDirection: 'row', gap: 1, flexWrap: 'wrap' }}
                >
                  {dateSlots.map((slot) => (
                    <FormControlLabel
                      key={`${dateString}-${slot.slot}`}
                      value={slot.slot}
                      control={<Radio size="small" />}
                      label={slot.slot === 'dopoledne' ? 'Dopoledne' : 'Odpoledne'}
                      sx={{ 
                        mb: 0,
                        mr: 1,
                        flex: '1 1 auto',
                        minWidth: 'fit-content',
                      }}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            </Box>
          ))}
        </Box>
        
        {selectedDate && selectedSlot && (
          <Box sx={{ mt: 2 }}>
            <TextField
              label="Přesný čas (volitelné, formát HH:mm)"
              placeholder="např. 09:30"
              value={manualTime}
              onChange={(e) => {
                const value = e.target.value;
                // Allow HH:mm format
                if (value === '' || /^([0-1]?[0-9]|2[0-3]):?([0-5]?[0-9])?$/.test(value)) {
                  onManualTimeChange(value);
                }
              }}
              helperText="Pokud chcete zadat přesnější čas než dopoledne/odpoledne"
              fullWidth
              size="small"
            />
          </Box>
        )}
      </Box>
    );
  };

  if (activeStep === 3) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <Paper sx={{ p: 4, maxWidth: 500, width: '100%', textAlign: 'center' }}>
          <Typography variant="h4" sx={{ mb: 2, fontWeight: 600 }}>
            Děkujeme za registraci!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Vaše registrace byla úspěšně odeslána. Organizátor ji zkontroluje a přidá vás do události.
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', py: 8 }}>
      <Paper sx={{ p: 4, maxWidth: 900, width: '100%' }}>
        {eventName && (
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ mb: 1, fontWeight: 600 }}>
              Registrace na událost
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {eventName}
            </Typography>
          </Box>
        )}

        <Stepper activeStep={activeStep} orientation="vertical">
          <Step>
            <StepLabel>Jméno a účast</StepLabel>
            <StepContent>
              <form onSubmit={handleNameSubmit}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    label="Vaše jméno"
                    required
                    placeholder="Zadejte vaše jméno"
                    value={rawName}
                    onChange={(e) => setRawName(e.target.value)}
                    disabled={isLoading}
                  />

                  <FormControl component="fieldset">
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                      Zúčastníte se?
                    </Typography>
                    <RadioGroup
                      value={participating === null ? '' : participating ? 'yes' : 'no'}
                      onChange={(e) => setParticipating(e.target.value === 'yes')}
                    >
                      <FormControlLabel
                        value="yes"
                        control={<Radio />}
                        label="Ano, zúčastním se"
                        disabled={isLoading}
                      />
                      <FormControlLabel
                        value="no"
                        control={<Radio />}
                        label="Ne, nezúčastním se"
                        disabled={isLoading}
                      />
                    </RadioGroup>
                  </FormControl>

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Zpracovávám...' : 'Pokračovat'}
                    </Button>
                  </Box>
                </Box>
              </form>
            </StepContent>
          </Step>

          <Step>
            <StepLabel>Čas příjezdu</StepLabel>
            <StepContent>
              <form onSubmit={handleArrivalSubmit}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {renderTimeSlotSelection(
                    arrivalSlots,
                    arrivalDate,
                    arrivalSlot,
                    setArrivalDate,
                    setArrivalSlot,
                    arrivalManualTime,
                    setArrivalManualTime,
                  )}

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={() => setActiveStep(0)}
                      disabled={isLoading}
                    >
                      Zpět
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      Pokračovat
                    </Button>
                  </Box>
                </Box>
              </form>
            </StepContent>
          </Step>

          <Step>
            <StepLabel>Čas odjezdu</StepLabel>
            <StepContent>
              <form onSubmit={handleLeaveSubmit}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {renderTimeSlotSelection(
                    leaveSlots,
                    leaveDate,
                    leaveSlot,
                    setLeaveDate,
                    setLeaveSlot,
                    leaveManualTime,
                    setLeaveManualTime,
                  )}

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={() => setActiveStep(1)}
                      disabled={isLoading}
                    >
                      Zpět
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Odesílám...' : 'Odeslat registraci'}
                    </Button>
                  </Box>
                </Box>
              </form>
            </StepContent>
          </Step>
        </Stepper>
      </Paper>
    </Box>
  );
}
