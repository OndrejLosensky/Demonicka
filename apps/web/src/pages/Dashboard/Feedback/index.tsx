import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Box, Card, Typography, Button, TextField } from '@demonicka/ui';
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
    <Box sx={{ maxWidth: 560, mx: 'auto' }}>
      <Card sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
          Zpětná vazba
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Slouží k hlášení chyb, návrhům na vylepšení nebo jakékoli jiné zpětné vazbě. Vaše zprávy ukládáme a průběžně je procházíme.
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Zpráva"
            placeholder="Napište svůj nápad, hlášení chyby nebo připomínku…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            multiline
            minRows={4}
            maxRows={12}
            fullWidth
            disabled={isSubmitting}
            inputProps={{ maxLength: 5000 }}
            helperText={`${message.length}/5000`}
            sx={{ mb: 2 }}
          />
          <Button type="submit" variant="contained" disabled={isSubmitting || !message.trim()}>
            {isSubmitting ? 'Odesílám…' : 'Odeslat'}
          </Button>
        </form>
      </Card>
    </Box>
  );
}
