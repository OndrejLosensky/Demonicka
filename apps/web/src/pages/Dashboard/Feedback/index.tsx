import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Box, Card, Typography, Button, TextField } from '@demonicka/ui';
import { Feedback as FeedbackIcon } from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';
import { feedbackApi } from '../../../services/feedbackService';
import { notify } from '../../../notifications/notify';

export function FeedbackPage() {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) return <Navigate to="/login" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) {
      notify.error('Napište prosím zprávu.');
      return;
    }
    setIsSubmitting(true);
    try {
      await feedbackApi.submit(trimmed, 'web');
      notify.success('Děkujeme! Zpětná vazba byla odeslána.');
      setMessage('');
    } catch (e) {
      notify.error(notify.fromError(e));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ width: '100%', pt: 1 }}>
      <Card
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <FeedbackIcon sx={{ fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              Pošlete nám zprávu
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Hlášení chyb, nápady na vylepšení nebo jakékoli připomínky. Vaše zprávy ukládáme a průběžně je procházíme.
            </Typography>
          </Box>
        </Box>

        <form onSubmit={handleSubmit}>
          <TextField
            label="Zpráva"
            placeholder="Napište svůj nápad, hlášení chyby nebo připomínku…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            multiline
            minRows={5}
            maxRows={14}
            fullWidth
            disabled={isSubmitting}
            inputProps={{ maxLength: 5000 }}
            helperText={`${message.length} / 5000`}
            sx={{
              mb: 2.5,
              '& .MuiOutlinedInput-root': {
                borderRadius: 1.5,
              },
            }}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="medium"
            disabled={isSubmitting || !message.trim()}
            sx={{ minWidth: 140, borderRadius: 1.5 }}
          >
            {isSubmitting ? 'Odesílám…' : 'Odeslat'}
          </Button>
        </form>
      </Card>
    </Box>
  );
}
