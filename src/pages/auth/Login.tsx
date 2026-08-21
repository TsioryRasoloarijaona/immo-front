import { useState } from 'react';
import AuthScreen from './AuthScreen';
import { useAuth } from '../../lib/auth';
import { ApiError } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Field, FieldGroup, FieldLabel, FieldError } from '../../components/ui/field';
import { Input } from '../../components/ui/input';

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setSubmitting(true);
    setError(null);
    try {
      await login({ username: username.trim(), password });
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? 'Identifiants invalides ou compte désactivé.'
          : err instanceof Error
            ? err.message
            : 'Erreur inconnue.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthScreen title="Connexion" description="Accédez à votre espace Ayad Développement.">
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <Field data-invalid={!!error}>
            <FieldLabel htmlFor="login-username">Nom d'utilisateur</FieldLabel>
            <Input
              id="login-username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </Field>
          <Field data-invalid={!!error}>
            <FieldLabel htmlFor="login-password">Mot de passe</FieldLabel>
            <Input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <FieldError>{error}</FieldError>}
          </Field>
          <Button type="submit" className="w-full" disabled={submitting || !username.trim() || !password}>
            {submitting ? 'Connexion…' : 'Se connecter'}
          </Button>
        </FieldGroup>
      </form>
    </AuthScreen>
  );
}
