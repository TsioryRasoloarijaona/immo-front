import { useState } from 'react';
import { Copy } from 'lucide-react';
import { Card, Field, FieldGrid } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { Field as FormField, FieldLabel, FieldError, FieldDescription } from '../../components/ui/field';
import { Input } from '../../components/ui/input';
import { ApiError, creerEmploye } from '../../lib/api';
import type { CreerEmployeResponse } from '../../types';
import AdminGuard from './AdminGuard';

// Renders a one-time temporary password in a copy-friendly box — the API
// never returns it a second time (no list-users endpoint exists at all to
// look it up later either), so this is the only chance to hand it to the
// employee.
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

function CreerEmployeCard() {
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [identifiant, setIdentifiant] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [typeEmployeCode, setTypeEmployeCode] = useState('');
  const [roles, setRoles] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreerEmployeResponse | null>(null);

  const canSubmit = prenom.trim() && nom.trim() && identifiant.trim() && email.trim() && typeEmployeCode.trim() && roles.trim();

  function reset() {
    setPrenom('');
    setNom('');
    setIdentifiant('');
    setEmail('');
    setMobile('');
    setTypeEmployeCode('');
    setRoles('');
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await creerEmploye({
        prenom: prenom.trim(),
        nom: nom.trim(),
        identifiant: identifiant.trim(),
        email: email.trim(),
        mobile: mobile.trim() || undefined,
        typeEmployeCode: typeEmployeCode.trim(),
        roles: roles.split(',').map((r) => r.trim()).filter(Boolean),
      });
      setResult(res);
      reset();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Erreur inconnue.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card title="Nouvel employé">
      <form onSubmit={submit}>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <FormField>
            <FieldLabel htmlFor="ce-prenom">Prénom</FieldLabel>
            <Input id="ce-prenom" autoFocus value={prenom} onChange={(e) => setPrenom(e.target.value)} required />
          </FormField>
          <FormField>
            <FieldLabel htmlFor="ce-nom">Nom</FieldLabel>
            <Input id="ce-nom" value={nom} onChange={(e) => setNom(e.target.value)} required />
          </FormField>
          <FormField>
            <FieldLabel htmlFor="ce-identifiant">Identifiant</FieldLabel>
            <Input id="ce-identifiant" placeholder="ex : j.dupont" value={identifiant} onChange={(e) => setIdentifiant(e.target.value)} required />
            <FieldDescription>Nom d'utilisateur du compte — doit être unique.</FieldDescription>
          </FormField>
          <FormField>
            <FieldLabel htmlFor="ce-email">Email</FieldLabel>
            <Input id="ce-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </FormField>
          <FormField>
            <FieldLabel htmlFor="ce-mobile">Mobile <span className="font-normal text-muted-foreground">(optionnel)</span></FieldLabel>
            <Input id="ce-mobile" type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} />
          </FormField>
          <FormField>
            <FieldLabel htmlFor="ce-type">Type d'employé</FieldLabel>
            <Input id="ce-type" placeholder="ex : COM" value={typeEmployeCode} onChange={(e) => setTypeEmployeCode(e.target.value)} required />
            <FieldDescription>Code CfgTierKind (ex : COM pour commercial) — doit exister en base.</FieldDescription>
          </FormField>
          <FormField className="sm:col-span-2">
            <FieldLabel htmlFor="ce-roles">Rôles</FieldLabel>
            <Input id="ce-roles" placeholder="ex : Commercial, Administrateur" value={roles} onChange={(e) => setRoles(e.target.value)} required />
            <FieldDescription>Codes AdmRole séparés par des virgules — au moins un requis, chacun doit exister en base.</FieldDescription>
          </FormField>
          {error && <FieldError className="sm:col-span-2">{error}</FieldError>}
          <div className="sm:col-span-2">
            <Button type="submit" disabled={submitting || !canSubmit}>
              {submitting ? 'Création…' : 'Créer l’employé'}
            </Button>
          </div>
        </div>
      </form>

      {result && (
        <div className="mt-4 flex flex-col gap-3">
          <FieldGrid>
            <Field label="Identifiant" value={result.identifiant} />
            <Field label="Rôles" value={result.roles?.join(', ')} />
            <Field label="Id compte (admUserId)" value={result.admUserId} />
            <Field label="Id fiche employé (cfgTierId)" value={result.cfgTierId} />
          </FieldGrid>
          {result.motDePasseTemporaire && (
            <TempPasswordBox label="Mot de passe temporaire" value={result.motDePasseTemporaire} />
          )}
        </div>
      )}
    </Card>
  );
}

export default function NouvelUtilisateur() {
  return (
    <AdminGuard title="Nouvel utilisateur" crumbs={[{ label: 'Administration' }, { label: 'Nouvel utilisateur' }]}>
      <CreerEmployeCard />
    </AdminGuard>
  );
}
