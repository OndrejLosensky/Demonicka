import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AxiosError } from 'axios';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

interface FormErrors {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  firstName?: string;
  lastName?: string;
}

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const { register, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!username.trim()) {
      newErrors.username = 'Username is required';
    } else if (username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
      newErrors.email = 'Invalid email address';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (firstName.length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }
    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (lastName.length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setIsLoading(true);
    try {
      await register(username, email, password, firstName, lastName);
      navigate('/dashboard');
    } catch (err) {
      if (err instanceof AxiosError) {
        const data = err.response?.data;
        if (Array.isArray(data?.message)) {
          const backendErrors: FormErrors = {};
          type ValidationError = { property: string; constraints: Record<string, string> };
          if (typeof data.message[0] === 'string') {
            backendErrors.password = data.message.join(' ');
          } else {
            (data.message as ValidationError[]).forEach((msg) => {
              if (msg && msg.property && msg.constraints) {
                const field = msg.property as keyof FormErrors;
                backendErrors[field] = Object.values(msg.constraints).join(' ');
              }
            });
          }
          setErrors(backendErrors);
        } else {
          const errorMessage = data?.message || 'Registration failed';
          if (errorMessage.includes('email')) {
            setErrors({ email: errorMessage });
          } else if (errorMessage.includes('username')) {
            setErrors({ username: errorMessage });
          } else {
            setErrors({ password: errorMessage });
          }
        }
      } else {
        setErrors({ password: 'An unexpected error occurred' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join us and start your journey"
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="firstName"
              name="firstName"
              type="text"
              label="First Name"
              required
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                setErrors({ ...errors, firstName: undefined });
              }}
              placeholder="Enter your first name"
              error={errors.firstName}
            />
            <Input
              id="lastName"
              name="lastName"
              type="text"
              label="Last Name"
              required
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                setErrors({ ...errors, lastName: undefined });
              }}
              placeholder="Enter your last name"
              error={errors.lastName}
            />
          </div>
          
          <Input
            id="username"
            name="username"
            type="text"
            label="Username"
            required
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setErrors({ ...errors, username: undefined });
            }}
            placeholder="Choose a username"
            error={errors.username}
          />

          <Input
            id="email"
            name="email"
            type="email"
            label="Email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrors({ ...errors, email: undefined });
            }}
            placeholder="Enter your email"
            error={errors.email}
          />

          <Input
            id="password"
            name="password"
            type="password"
            label="Password"
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrors({ ...errors, password: undefined });
            }}
            placeholder="Create a password"
            error={errors.password}
          />

          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            label="Confirm Password"
            required
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setErrors({ ...errors, confirmPassword: undefined });
            }}
            placeholder="Confirm your password"
            error={errors.confirmPassword}
          />
        </div>

        <Button
          type="submit"
          isLoading={isLoading}
          fullWidth
        >
          {isLoading ? 'Creating account...' : 'Create account'}
        </Button>
      </form>

      <div className="text-sm text-center mt-6">
        <Link 
          to="/login" 
          className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200"
        >
          Already have an account? Sign in
        </Link>
      </div>
    </AuthLayout>
  );
} 