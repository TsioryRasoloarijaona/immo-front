import { useState } from 'react';
import AuthScreen from './AuthScreen';
import { useAuth } from '../../lib/auth';
import { ApiError } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Field, FieldGroup, FieldLabel, FieldError, FieldDescription } from '../../components/ui/field';
import { Input } from '../../components/ui/input';

/** Forced screen — shown whenever `mustChangePassword` is true, whether
 * that's after an admin reset or on a brand-new account's very first
 * login. Nothing else in the app is reachable until this resolves (the
 * backend itself enforces this with 403s on every other route). */
export default function ChangePasswordGate() {
  const { changePassword, logout } = useAuth();
  const [ancien, setAncien] = useState('');
  const [nouveau, setNouveau] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const mismatch = confirmation.length > 0 && nouveau !== confirmation;
  const tooShort = nouveau.length > 0 && nouveau.length < 8;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ancien || nouveau.length < 8 || nouveau !== confirmation) return;
    setSubmitting(true);
    setError(null);
    try {
      await changePassword({ ancienMotDePasse: ancien, nouveauMotDePasse: nouveau });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Erreur inconnue.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthScreen
      title="Changement de mot de passe requis"
      description="Un mot de passe temporaire est actif sur ce compte — choisissez-en un nouveau pour continuer."
    >
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="cp-ancien">Mot de passe actuel</FieldLabel>
            <Input
              id="cp-ancien"
              type="password"
              autoComplete="current-password"
              autoFocus
              value={ancien}
              onChange={(e) => setAncien(e.target.value)}
              required
            />
          </Field>
          <Field data-invalid={tooShort}>
            <FieldLabel htmlFor="cp-nouveau">Nouveau mot de passe</FieldLabel>
            <Input
              id="cp-nouveau"
              type="password"
              autoComplete="new-password"
              value={nouveau}
              onChange={(e) => setNouveau(e.target.value)}
              required
            />
            <FieldDescription>Au moins 8 caractères.</FieldDescription>
          </Field>
          <Field data-invalid={mismatch}>
            <FieldLabel htmlFor="cp-confirmation">Confirmer le nouveau mot de passe</FieldLabel>
            <Input
              id="cp-confirmation"
              type="password"
              autoComplete="new-password"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              required
            />
            {mismatch && <FieldError>Les deux mots de passe ne correspondent pas.</FieldError>}
          </Field>
          {error && <FieldError>{error}</FieldError>}
          <Button type="submit" className="w-full" disabled={submitting || !ancien || nouveau.length < 8 || nouveau !== confirmation}>
            {submitting ? 'Enregistrement…' : 'Changer le mot de passe'}
          </Button>
          <Button type="button" variant="ghost" className="w-full" onClick={() => void logout()}>
            Se déconnecter
          </Button>
        </FieldGroup>
      </form>
    </AuthScreen>
  );
}
