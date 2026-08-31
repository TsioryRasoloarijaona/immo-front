import { useState } from 'react';
import AuthScreen from './AuthScreen';
import { useAuth } from '../../lib/auth';
import { ApiError } from '../../lib/api';
import { toApiDateTime } from '../../lib/format';
import { Button } from '../../components/ui/button';
import { Field, FieldGroup, FieldLabel, FieldError } from '../../components/ui/field';
import { Input } from '../../components/ui/input';

/** Forced screen — shown once per account, right after the first
 * mustChangePassword resolves, whenever `profileCompleted` is still false.
 * Fills in the employee record (CfgTier) linked to the AdmUser account. */
export default function CompleteProfileGate() {
  const { completeProfile, logout } = useAuth();
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [dateNaissance, setDateNaissance] = useState('');
  const [adresse, setAdresse] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = prenom.trim() && nom.trim() && telephone.trim() && email.trim() && dateNaissance;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await completeProfile({
        prenom: prenom.trim(),
        nom: nom.trim(),
        telephone: telephone.trim(),
        email: email.trim(),
        dateNaissance: toApiDateTime(dateNaissance)!,
        adresse: adresse.trim() || undefined,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Erreur inconnue.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthScreen title="Complétez votre profil" description="Quelques informations avant votre première connexion.">
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel htmlFor="cpl-prenom">Prénom</FieldLabel>
              <Input id="cpl-prenom" autoFocus value={prenom} onChange={(e) => setPrenom(e.target.value)} required />
            </Field>
            <Field>
              <FieldLabel htmlFor="cpl-nom">Nom</FieldLabel>
              <Input id="cpl-nom" value={nom} onChange={(e) => setNom(e.target.value)} required />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="cpl-telephone">Téléphone mobile</FieldLabel>
            <Input id="cpl-telephone" type="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} required />
          </Field>
          <Field>
            <FieldLabel htmlFor="cpl-email">Email</FieldLabel>
            <Input id="cpl-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Field>
            <FieldLabel htmlFor="cpl-date-naissance">Date de naissance</FieldLabel>
            <Input
              id="cpl-date-naissance"
              type="date"
              value={dateNaissance}
              onChange={(e) => setDateNaissance(e.target.value)}
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="cpl-adresse">Adresse <span className="font-normal text-muted-foreground">(optionnel)</span></FieldLabel>
            <Input id="cpl-adresse" value={adresse} onChange={(e) => setAdresse(e.target.value)} />
          </Field>
          {error && <FieldError>{error}</FieldError>}
          <Button type="submit" className="w-full" disabled={submitting || !canSubmit}>
            {submitting ? 'Enregistrement…' : 'Continuer'}
          </Button>
          <Button type="button" variant="ghost" className="w-full" onClick={() => void logout()}>
            Se déconnecter
          </Button>
        </FieldGroup>
      </form>
    </AuthScreen>
  );
}
