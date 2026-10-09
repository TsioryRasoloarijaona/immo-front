import { useState } from 'react';
import { UserCircle } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { Badge, Card, Field, FieldGrid } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { Field as FormField, FieldLabel, FieldError, FieldDescription } from '../../components/ui/field';
import { Input } from '../../components/ui/input';
import { useAuth } from '../../lib/auth';
import { toApiDateTime } from '../../lib/format';
import { ROLES_EXEMPTES } from '../../lib/roles';
import { errorMessage } from '../../lib/useApi';

// `GET /api/mon-compte` ne sert que `description` (« Prénom Nom ») : coupée au premier espace.
function splitDescription(description: string | undefined): { prenom: string; nom: string } {
  if (!description) return { prenom: '', nom: '' };
  const trimmed = description.trim();
  const idx = trimmed.indexOf(' ');
  if (idx === -1) return { prenom: trimmed, nom: '' };
  return { prenom: trimmed.slice(0, idx), nom: trimmed.slice(idx + 1) };
}

function InformationsPersonnelles() {
  const { user, completeProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [dateNaissance, setDateNaissance] = useState('');
  const [adresse, setAdresse] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  function startEdit() {
    const { prenom: p, nom: n } = splitDescription(user?.description);
    setPrenom(p);
    setNom(n);
    setTelephone('');
    setEmail(user?.email ?? '');
    setDateNaissance('');
    setAdresse('');
    setError(null);
    setEditing(true);
  }

  const canSubmit = prenom.trim() && nom.trim() && telephone.trim() && email.trim() && dateNaissance;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
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
      setEditing(false);
      setSavedAt(Date.now());
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card
      title="Informations personnelles"
      action={
        editing ? (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Annuler</Button>
            <Button size="sm" form="profil-form" type="submit" disabled={saving || !canSubmit}>
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="outline" onClick={startEdit}>Modifier</Button>
        )
      }
    >
      {editing ? (
        <form id="profil-form" onSubmit={save}>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <FormField>
              <FieldLabel htmlFor="p-prenom">Prénom</FieldLabel>
              <Input id="p-prenom" autoFocus value={prenom} onChange={(e) => setPrenom(e.target.value)} required />
            </FormField>
            <FormField>
              <FieldLabel htmlFor="p-nom">Nom</FieldLabel>
              <Input id="p-nom" value={nom} onChange={(e) => setNom(e.target.value)} required />
            </FormField>
            <FormField>
              <FieldLabel htmlFor="p-telephone">Téléphone mobile</FieldLabel>
              <Input id="p-telephone" type="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} required />
            </FormField>
            <FormField>
              <FieldLabel htmlFor="p-email">Email</FieldLabel>
              <Input id="p-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </FormField>
            <FormField>
              <FieldLabel htmlFor="p-date-naissance">Date de naissance</FieldLabel>
              <Input
                id="p-date-naissance"
                type="date"
                value={dateNaissance}
                onChange={(e) => setDateNaissance(e.target.value)}
                required
              />
            </FormField>
            <FormField>
              <FieldLabel htmlFor="p-adresse">Adresse <span className="font-normal text-muted-foreground">(optionnel)</span></FieldLabel>
              <Input id="p-adresse" value={adresse} onChange={(e) => setAdresse(e.target.value)} />
            </FormField>
            <FieldDescription className="sm:col-span-2">
              L'API ne renvoie pas le téléphone, la date de naissance ni l'adresse actuellement enregistrés — merci
              de les ressaisir à chaque mise à jour.
            </FieldDescription>
            {error && <FieldError className="sm:col-span-2">{error}</FieldError>}
          </div>
        </form>
      ) : (
        <div className="flex flex-col gap-3.5">
          <FieldGrid>
            <Field label="Nom complet" value={user?.description} />
            <Field label="Nom d'utilisateur" value={user?.username} />
            <Field label="Email" value={user?.email} />
            <Field label="Rôles" value={user?.roles && user.roles.length > 0 ? user.roles.join(', ') : undefined} />
          </FieldGrid>
          {savedAt && (
            <p className="text-body text-(--success)">Profil mis à jour avec succès.</p>
          )}
        </div>
      )}
    </Card>
  );
}

function Securite() {
  const { changePassword } = useAuth();
  const [ancien, setAncien] = useState('');
  const [nouveau, setNouveau] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const mismatch = confirmation.length > 0 && nouveau !== confirmation;
  const tooShort = nouveau.length > 0 && nouveau.length < 8;
  const canSubmit = ancien && nouveau.length >= 8 && nouveau === confirmation;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await changePassword({ ancienMotDePasse: ancien, nouveauMotDePasse: nouveau });
      setAncien('');
      setNouveau('');
      setConfirmation('');
      setSavedAt(Date.now());
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card title="Sécurité">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-3.5 sm:max-w-md">
          <FormField>
            <FieldLabel htmlFor="s-ancien">Mot de passe actuel</FieldLabel>
            <Input
              id="s-ancien"
              type="password"
              autoComplete="current-password"
              value={ancien}
              onChange={(e) => setAncien(e.target.value)}
              required
            />
          </FormField>
          <FormField data-invalid={tooShort}>
            <FieldLabel htmlFor="s-nouveau">Nouveau mot de passe</FieldLabel>
            <Input
              id="s-nouveau"
              type="password"
              autoComplete="new-password"
              value={nouveau}
              onChange={(e) => setNouveau(e.target.value)}
              required
            />
            <FieldDescription>Au moins 8 caractères.</FieldDescription>
          </FormField>
          <FormField data-invalid={mismatch}>
            <FieldLabel htmlFor="s-confirmation">Confirmer le nouveau mot de passe</FieldLabel>
            <Input
              id="s-confirmation"
              type="password"
              autoComplete="new-password"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              required
            />
            {mismatch && <FieldError>Les deux mots de passe ne correspondent pas.</FieldError>}
          </FormField>
          {error && <FieldError>{error}</FieldError>}
          {savedAt && <p className="text-body text-(--success)">Mot de passe changé avec succès.</p>}
          <Button type="submit" disabled={submitting || !canSubmit} className="w-fit">
            {submitting ? 'Enregistrement…' : 'Changer le mot de passe'}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function SansRestriction({ exemptRoles }: Readonly<{ exemptRoles: string[] }>) {
  if (exemptRoles.length > 0) {
    return (
      <p className="text-body text-muted-foreground">
        Aucune restriction ne s'applique à votre compte : le rôle{' '}
        <span className="font-medium text-foreground">{exemptRoles.join(' / ')}</span> vous donne accès à
        tous les projets, quelle que soit l'affectation.
      </p>
    );
  }
  return (
    <p className="text-body text-muted-foreground">
      Aucune restriction de périmètre n'est appliquée à ce compte : vous avez accès à tous les
      projets. Un administrateur peut en configurer une depuis l'écran Comptes utilisateurs si
      nécessaire.
    </p>
  );
}

/* Trois états distincts : restreint à `projetsAutorises` ; non restreint par rôle exempté ;
   non restreint faute d'affectation — l'état par défaut, jamais à présenter comme une erreur. */
function ProjetsAffectes() {
  const { user } = useAuth();
  const exemptRoles = (user?.roles ?? []).filter((r) => ROLES_EXEMPTES.has(r));
  const projets = user?.projetsAutorises ?? [];

  return (
    <Card title="Projets affectés">
      {user?.perimetreRestreint ? (
        <div className="flex flex-col gap-3">
          <p className="text-body text-muted-foreground">
            Votre compte est limité aux projets ci-dessous : vous ne voyez que leurs prospections,
            pré-prospections, dossiers et encaissements.
          </p>
          {projets.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              {projets.map((p) => (
                <div key={p.id} className="flex items-center gap-2.5 rounded-md px-1.5 py-1">
                  <Badge tone="info">{p.code ?? '—'}</Badge>
                  <span className="text-body text-foreground">{p.libelle ?? ''}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-body text-muted-foreground">Aucun projet n'est actuellement affecté à ce compte.</p>
          )}
          <p className="text-micro text-muted-foreground">
            Seul un administrateur peut modifier cette affectation, depuis l'écran Comptes utilisateurs.
          </p>
        </div>
      ) : (
        <SansRestriction exemptRoles={exemptRoles} />
      )}
    </Card>
  );
}

export default function Profil() {
  const { user } = useAuth();

  return (
    <PageShell title="Mon profil" crumbs={[{ label: 'Mon profil' }]} icon={<UserCircle />} accent="var(--sec-accent)" accentBg="var(--sec-accent-bg)">
      <div className="mb-3.5">
        {/* h2 et non h1 : PageShell rend déjà le seul h1 de la page. */}
        <h2 className="text-hero font-semibold tracking-tight text-foreground">{user?.description || user?.username}</h2>
        <div className="mt-1 flex items-center gap-1.5 text-label text-muted-foreground">
          {user?.username}
          {user?.roles?.map((r) => (
            <Badge key={r} tone="info">{r}</Badge>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <InformationsPersonnelles />
        <Securite />
        <ProjetsAffectes />
      </div>
    </PageShell>
  );
}
