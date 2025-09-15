import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  AccessTime as TimeIcon,
  Event as EventIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';

interface EventInfo {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
}

interface ArrivalData {
  name: string;
  email: string;
  phone: string;
  arrivalTime: string;
  notes?: string;
}

const ArrivalRegistration: React.FC = () => {
  const { eventId, token } = useParams<{ eventId?: string; token?: string }>();
  const navigate = useNavigate();
  const [eventInfo, setEventInfo] = useState<EventInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<ArrivalData>({
    name: '',
    email: '',
    phone: '',
    arrivalTime: new Date().toISOString().slice(0, 16),
    notes: '',
  });

  useEffect(() => {
    // Simulate loading event info
    const loadEventInfo = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock event data
        setEventInfo({
          id: eventId || 'mock-event',
          name: 'Demonická 2024',
          description: 'Roční setkání přátel s pivem',
          startDate: '2024-06-15T14:00:00Z',
          endDate: '2024-06-16T02:00:00Z',
          location: 'Chalupa u lesa',
        });
      } catch (err) {
        setError('Nepodařilo se načíst informace o události');
      } finally {
        setLoading(false);
      }
    };

    loadEventInfo();
  }, [eventId, token]);

  const handleInputChange = (field: keyof ArrivalData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Jméno a email jsou povinné');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSuccess(true);
    } catch (err) {
      setError('Nepodařilo se odeslat registraci příchodu');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        bgcolor: 'grey.50'
      }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (success) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        bgcolor: 'grey.50',
        p: 3
      }}>
        <Card sx={{ maxWidth: 500, width: '100%' }}>
          <CardContent sx={{ textAlign: 'center', p: 4 }}>
            <CheckIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Registrace úspěšná!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Vaše registrace příchodu byla úspěšně odeslána.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Čas příchodu: {format(new Date(formData.arrivalTime), 'dd.MM.yyyy HH:mm', { locale: cs })}
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: 'grey.50',
      py: 4
    }}>
      <Box sx={{ maxWidth: 800, mx: 'auto', px: 3 }}>
        {/* Event Info */}
        {eventInfo && (
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <EventIcon color="primary" sx={{ fontSize: 32 }} />
                <Typography variant="h5" fontWeight="bold">
                  {eventInfo.name}
                </Typography>
              </Box>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                {eventInfo.description}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Začátek:</strong> {format(new Date(eventInfo.startDate), 'dd.MM.yyyy HH:mm', { locale: cs })}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Konec:</strong> {format(new Date(eventInfo.endDate), 'dd.MM.yyyy HH:mm', { locale: cs })}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Místo:</strong> {eventInfo.location}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Registration Form */}
        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Registrace příchodu
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Vyplňte prosím následující údaje pro registraci vašeho příchodu na událost.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Jméno a příjmení"
                  value={formData.name}
                  onChange={handleInputChange('name')}
                  required
                  InputProps={{
                    startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  required
                  InputProps={{
                    startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Telefon"
                  value={formData.phone}
                  onChange={handleInputChange('phone')}
                  InputProps={{
                    startAdornment: <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Čas příchodu"
                  type="datetime-local"
                  value={formData.arrivalTime}
                  onChange={handleInputChange('arrivalTime')}
                  InputProps={{
                    startAdornment: <TimeIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Poznámky (volitelné)"
                  multiline
                  rows={3}
                  value={formData.notes}
                  onChange={handleInputChange('notes')}
                  placeholder="Např. přijdu později, přijdu s přáteli..."
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => navigate(-1)}
                disabled={submitting}
              >
                Zpět
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={submitting}
                startIcon={submitting ? <CircularProgress size={20} /> : null}
              >
                {submitting ? 'Odesílání...' : 'Registrovat příchod'}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default ArrivalRegistration;
