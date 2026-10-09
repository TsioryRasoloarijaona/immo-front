import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, ClipboardCopy, Copy, KeyRound } from 'lucide-react';
import { Card, EnvoiMailNotice, Field, FieldGrid } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { Field as FormField, FieldLabel, FieldError, FieldDescription } from '../../components/ui/field';
import { Input } from '../../components/ui/input';
import { ApiError, reinitialiserMotDePasse } from '../../lib/api';
import type { ReinitialiserMotDePasseResponse } from '../../types';
import AdminGuard from './AdminGuard';

/** Adresse publique d'Arpent, reprise dans le bloc « Copier les identifiants »
 * — la même que le lien du mail (app.arpent.url côté backend). */
const ARPENT_URL = 'https://arpent.ayaddeveloppement.com';

/** Ce que la liste des comptes transmet en naviguant ici (UtilisateursList),
 * pour afficher le compte sans requête supplémentaire. Absent si l'on arrive
 * par le menu ou par une URL saisie : on retombe alors sur l'id à saisir. */
export interface CompteAReinitialiser {
  username?: string;
  description?: string;
  email?: string;
}

/** Bouton de copie avec retour visuel « Copié » pendant 1,5 s. */
function CopierBouton({ texte, libelle, compact }: Readonly<{ texte: string; libelle: string; compact?: boolean }>) {
  const [etat, setEtat] = useState<'repos' | 'copie' | 'echec'>('repos');
  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (minuteur.current) clearTimeout(minuteur.current);
  }, []);

  async function copier() {
    try {
      await navigator.clipboard.writeText(texte);
      setEtat('copie');
    } catch {
      setEtat('echec');
    }
    if (minuteur.current) clearTimeout(minuteur.current);
    minuteur.current = setTimeout(() => setEtat('repos'), 1500);
  }

  const libelleRepos = compact ? 'Copier' : libelle;
  const contenu = { copie: 'Copié', echec: 'Copie impossible', repos: libelleRepos }[etat];
  const IconeRepos = compact ? Copy : ClipboardCopy;
  return (
    <Button type="button" size="sm" variant={compact ? 'outline' : 'default'} onClick={copier} aria-label={libelle} aria-live="polite">
      {etat === 'copie' ? <Check data-icon="inline-start" /> : <IconeRepos data-icon="inline-start" />}
      {contenu}
    </Button>
  );
}

function LigneSecret({ libelle, valeur, monospace }: Readonly<{ libelle: string; valeur: string; monospace?: boolean }>) {
  return (
    <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
      <div className="w-28 shrink-0 text-micro font-medium text-muted-foreground">{libelle}</div>
      <code
        className={
          'min-w-0 flex-1 truncate rounded-md border border-border bg-background px-2.5 py-1.5 text-label text-foreground ' +
          (monospace ? 'font-mono font-semibold tracking-wider' : 'font-medium')
        }
      >
        {valeur}
      </code>
      <CopierBouton texte={valeur} libelle={`Copier ${libelle.toLowerCase()}`} compact />
    </div>
  );
}

function Identifiants({ result }: Readonly<{ result: ReinitialiserMotDePasseResponse }>) {
  const username = result.username ?? '';
  const motDePasse = result.motDePasseTemporaire ?? '';
  const bloc = `Arpent : ${ARPENT_URL}\nIdentifiant : ${username}\nMot de passe : ${motDePasse}`;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/40 p-3">
        <LigneSecret libelle="Identifiant" valeur={username} />
        <LigneSecret libelle="Mot de passe" valeur={motDePasse} monospace />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <CopierBouton texte={bloc} libelle="Copier les identifiants" />
        <span className="text-micro text-muted-foreground">Lien Arpent, identifiant et mot de passe, prêts à coller.</span>
      </div>
      <EnvoiMailNotice envoye={result.emailEnvoye} destinataire={result.destinataire} />
      <p className="text-micro text-muted-foreground">
        Le compte peut se connecter tout de suite avec ces identifiants ; ses autres sessions ont été fermées.
      </p>
    </div>
  );
}

function ReinitialiserMotDePasseCard() {
  const [searchParams] = useSearchParams();
  const compte = (useLocation().state as CompteAReinitialiser | null) ?? null;
  // Pré-rempli depuis l'action « Réinitialiser » d'une ligne de /utilisateurs
  // (UtilisateursList.tsx) — saisissable à la main sinon.
  const idDepuisListe = searchParams.get('admUserId') ?? '';
  const [admUserId, setAdmUserId] = useState(idDepuisListe);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [erreurEmail, setErreurEmail] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [result, setResult] = useState<ReinitialiserMotDePasseResponse | null>(null);

  const emailConnu = compte?.email?.trim() || undefined;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!admUserId.trim()) return;
    setSubmitting(true);
    setErreur(null);
    setErreurEmail(null);
    try {
      setResult(await reinitialiserMotDePasse(admUserId.trim(), email));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue.';
      // 400 = seul cas : l'adresse saisie est invalide (le compte est intact).
      if (err instanceof ApiError && err.status === 400) setErreurEmail(message);
      else if (err instanceof ApiError && err.status === 404) setErreur('Compte introuvable — il a peut-être été supprimé dans Omran.');
      else if (err instanceof ApiError && err.status === 403) setErreur('Action réservée aux administrateurs.');
      else setErreur(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <Card title="Identifiants Arpent">
        <Identifiants result={result} />
        <div className="mt-4 border-t border-border pt-3">
          <Button variant="outline" size="sm" render={<Link to="/utilisateurs" />}>
            <ArrowLeft data-icon="inline-start" /> Retour aux comptes
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Réinitialiser le mot de passe Arpent">
      <form onSubmit={submit} className="flex max-w-xl flex-col gap-4">
        <p className="text-body text-muted-foreground">
          Génère un nouveau mot de passe Arpent pour le login Omran du compte. Le compte peut se connecter
          immédiatement ; ses sessions en cours sont fermées.
        </p>

        {idDepuisListe && compte ? (
          <FieldGrid>
            <Field label="Identifiant" value={compte.username} />
            <Field label="Nom" value={compte.description} />
            <Field label="Email connu" value={emailConnu ?? 'Aucun'} muted={!emailConnu} />
          </FieldGrid>
        ) : (
          <FormField>
            <FieldLabel htmlFor="rp-admuserid">Id du compte (admUserId)</FieldLabel>
            <Input
              id="rp-admuserid"
              placeholder="UUID du compte à réinitialiser"
              value={admUserId}
              onChange={(e) => setAdmUserId(e.target.value)}
              required
            />
            <FieldDescription>
              Pré-rempli quand vous passez par la liste des{' '}
              <Link to="/utilisateurs" className="underline underline-offset-2">comptes utilisateurs</Link>.
            </FieldDescription>
          </FormField>
        )}

        <FormField data-invalid={erreurEmail ? true : undefined}>
          <FieldLabel htmlFor="rp-email">Email (facultatif)</FieldLabel>
          <Input
            id="rp-email"
            type="email"
            inputMode="email"
            autoComplete="off"
            placeholder={emailConnu ?? 'prenom.nom@exemple.ma'}
            value={email}
            aria-invalid={erreurEmail ? true : undefined}
            onChange={(e) => {
              setEmail(e.target.value);
              setErreurEmail(null);
            }}
          />
          <FieldDescription>
            {emailConnu
              ? `Laisser vide pour envoyer à ${emailConnu}. Une autre adresse ne sert que pour cet envoi ; elle n'est pas enregistrée.`
              : 'Pour envoyer les identifiants ; laisser vide pour seulement les afficher. Adresse utilisée pour cet envoi seulement, jamais enregistrée.'}
          </FieldDescription>
          {erreurEmail && <FieldError>{erreurEmail}</FieldError>}
        </FormField>

        {erreur && <FieldError>{erreur}</FieldError>}

        <div>
          <Button type="submit" disabled={submitting || !admUserId.trim()}>
            <KeyRound data-icon="inline-start" />
            {submitting ? 'Réinitialisation…' : 'Réinitialiser le mot de passe'}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default function ReinitialiserMotDePasse() {
  return (
    <AdminGuard title="Réinitialiser un mot de passe" crumbs={[{ label: 'Administration' }, { label: 'Comptes utilisateurs', to: '/utilisateurs' }, { label: 'Réinitialiser un mot de passe' }]}>
      <ReinitialiserMotDePasseCard />
    </AdminGuard>
  );
}
