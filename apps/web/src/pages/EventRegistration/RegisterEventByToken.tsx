import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePageTitle } from '../../hooks/usePageTitle';
import { toast } from 'react-hot-toast';
import { Input, Button } from '@demonicka/ui';
import { eventRegistrationService, type CreateRegistrationDto } from '../../services/eventRegistrationService';
import { DateTimePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { cs } from 'date-fns/locale';

type Step = 'name' | 'arrival' | 'leave' | 'complete';

export function RegisterEventByToken() {
  usePageTitle('Registrace na událost');
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('name');
  const [isLoading, setIsLoading] = useState(false);
  const [eventName, setEventName] = useState<string>('');
  const [rawName, setRawName] = useState('');
  const [participating, setParticipating] = useState<boolean | null>(null);
  const [arrivalTime, setArrivalTime] = useState<Date | null>(null);
  const [leaveTime, setLeaveTime] = useState<Date | null>(null);

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
    setStep('arrival');
  };

  const handleArrivalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!arrivalTime) {
      toast.error('Prosím vyberte čas příjezdu');
      return;
    }
    setStep('leave');
  };

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveTime) {
      toast.error('Prosím vyberte čas odjezdu');
      return;
    }

    if (arrivalTime && leaveTime && arrivalTime >= leaveTime) {
      toast.error('Čas příjezdu musí být před časem odjezdu');
      return;
    }

    await submitRegistration({
      rawName: rawName.trim(),
      participating: true,
      arrivalTime: arrivalTime.toISOString(),
      leaveTime: leaveTime.toISOString(),
    });
  };

  const submitRegistration = async (data: CreateRegistrationDto) => {
    if (!token) return;

    try {
      setIsLoading(true);
      await eventRegistrationService.createRegistration(token, data);
      setStep('complete');
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

  if (step === 'complete') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 text-center">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Děkujeme za registraci!
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Vaše registrace byla úspěšně odeslána. Organizátor ji zkontroluje a přidá vás do události.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={cs}>
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8">
          {eventName && (
            <div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Registrace na událost
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">{eventName}</p>
            </div>
          )}

          {step === 'name' && (
            <form className="mt-8 space-y-6" onSubmit={handleNameSubmit}>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zúčastníte se?
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="participating"
                      value="yes"
                      checked={participating === true}
                      onChange={() => setParticipating(true)}
                      className="mr-2"
                      disabled={isLoading}
                    />
                    Ano, zúčastním se
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="participating"
                      value="no"
                      checked={participating === false}
                      onChange={() => setParticipating(false)}
                      className="mr-2"
                      disabled={isLoading}
                    />
                    Ne, nezúčastním se
                  </label>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Zpracovávám...' : 'Pokračovat'}
              </Button>
            </form>
          )}

          {step === 'arrival' && (
            <form className="mt-8 space-y-6" onSubmit={handleArrivalSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Čas příjezdu
                </label>
                <DateTimePicker
                  value={arrivalTime}
                  onChange={(newValue) => setArrivalTime(newValue)}
                  disabled={isLoading}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                    },
                  }}
                />
              </div>

              <div className="flex space-x-4">
                <Button
                  type="button"
                  variant="outlined"
                  className="flex-1"
                  onClick={() => setStep('name')}
                  disabled={isLoading}
                >
                  Zpět
                </Button>
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  Pokračovat
                </Button>
              </div>
            </form>
          )}

          {step === 'leave' && (
            <form className="mt-8 space-y-6" onSubmit={handleLeaveSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Čas odjezdu
                </label>
                <DateTimePicker
                  value={leaveTime}
                  onChange={(newValue) => setLeaveTime(newValue)}
                  minDateTime={arrivalTime || undefined}
                  disabled={isLoading}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                    },
                  }}
                />
              </div>

              <div className="flex space-x-4">
                <Button
                  type="button"
                  variant="outlined"
                  className="flex-1"
                  onClick={() => setStep('arrival')}
                  disabled={isLoading}
                >
                  Zpět
                </Button>
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? 'Odesílám...' : 'Odeslat registraci'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </LocalizationProvider>
  );
}
