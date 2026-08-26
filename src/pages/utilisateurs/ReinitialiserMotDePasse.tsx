import { useState } from 'react';
import { Copy } from 'lucide-react';
import { Card, Field, FieldGrid } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { Field as FormField, FieldLabel, FieldError, FieldDescription } from '../../components/ui/field';
import { Input } from '../../components/ui/input';
import { ApiError, reinitialiserMotDePasse } from '../../lib/api';
import type { ReinitialiserMotDePasseResponse } from '../../types';
import AdminGuard from './AdminGuard';

function TempPasswordBox({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-md border border-[var(--warning)]/30 bg-[var(--warning-bg)] p-3">
      <div className="mb-1 text-[11.5px] font-medium text-[var(--warning)]">{label}</div>
      <div className="flex items-center gap-2">
        <code className="flex-1 truncate rounded bg-background px-2 py-1 text-[13px] font-medium text-foreground">{value}</code>
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          title="Copier"
          aria-label="Copier"
          onClick={() => {
            void navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          <Copy />
        </Button>
      </div>
      {copied && <div className="mt-1 text-[11.5px] text-[var(--success)]">Copié.</div>}
      <p className="mt-2 text-[11.5px] text-muted-foreground">
        À communiquer à l'employé par un canal hors-bande — ce mot de passe ne sera plus jamais affiché.
      </p>
    </div>
  );
}

function ReinitialiserMotDePasseCard() {
  const [admUserId, setAdmUserId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReinitialiserMotDePasseResponse | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!admUserId.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await reinitialiserMotDePasse(admUserId.trim());
      setResult(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Erreur inconnue.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card title="Réinitialiser un mot de passe">
      <form onSubmit={submit}>
        <div className="flex flex-wrap items-end gap-3">
          <FormField className="min-w-[280px] flex-1">
            <FieldLabel htmlFor="rp-admuserid">Id du compte (admUserId)</FieldLabel>
            <Input id="rp-admuserid" autoFocus placeholder="UUID du compte à réinitialiser" value={admUserId} onChange={(e) => setAdmUserId(e.target.value)} required />
            <FieldDescription>
              Aucun annuaire des comptes n'est encore exposé par l'API — l'identifiant doit être connu au préalable.
            </FieldDescription>
          </FormField>
          <Button type="submit" disabled={submitting || !admUserId.trim()}>
            {submitting ? 'Réinitialisation…' : 'Réinitialiser'}
          </Button>
        </div>
        {error && <FieldError className="mt-2">{error}</FieldError>}
      </form>

      {result && (
        <div className="mt-4 flex flex-col gap-3">
          <FieldGrid>
            <Field label="Compte" value={result.username} />
            <Field label="Id compte (admUserId)" value={result.admUserId} />
          </FieldGrid>
          {result.motDePasseTemporaire && (
            <TempPasswordBox label="Nouveau mot de passe temporaire" value={result.motDePasseTemporaire} />
          )}
        </div>
      )}
    </Card>
  );
}

export default function ReinitialiserMotDePasse() {
  return (
    <AdminGuard title="Réinitialiser un mot de passe" crumbs={[{ label: 'Administration' }, { label: 'Réinitialiser un mot de passe' }]}>
      <ReinitialiserMotDePasseCard />
    </AdminGuard>
  );
}
