import { Fragment, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Folder, Mail, Phone, Users } from 'lucide-react';
import Modal from './Modal';
import HotlineResultDialog from './HotlineResultDialog';
import { Avatar, Badge } from './ui';
import { Button } from './ui/button';
import { DialogFooter } from './ui/dialog';
import { getProspect, type CritereHotline } from '../lib/api';
import { useApi } from '../lib/useApi';
import { LIBELLES_GROUPE } from '../lib/colonnes';
import { DISPOSITION_SUIVI_ACTIONS } from '../lib/dispositions';
import { personDisplayName } from '../lib/domain';
import { formatDateTime, formatNumber, formatTelephone, texteBrut } from '../lib/format';
import type { ColonneDto, SuiviActionDto } from '../types';

function formater(c: ColonneDto, v: unknown): string {
  if (v === null || v === undefined || v === '') return '';
  switch (c.type) {
    case 'DATE':
      return formatDateTime(texteBrut(v));
    case 'BOOLEEN': {
      const vrai = Boolean(v);
      return vrai ? 'Oui' : 'Non';
    }
    case 'NOMBRE':
    case 'MONTANT':
      return formatNumber(Number(v));
    default:
      return texteBrut(v);
  }
}

function hrefTel(numero: string, indicatif?: string | null): string {
  const chiffres = numero.replace(/\D/g, '');
  return indicatif ? `tel:+${indicatif.replace(/\D/g, '')}${chiffres.replace(/^0/, '')}` : `tel:${chiffres}`;
}

function titreBoutonHotline(
  enAttente: boolean,
  critereDisponible: boolean,
  avecFiche: boolean,
  telephoneAffiche: string | null,
): string {
  if (enAttente) return 'Chargement de la fiche…';
  if (critereDisponible) return `Rechercher ${telephoneAffiche} dans la hotline`;
  if (avecFiche) return 'Aucun numéro sur la fiche : la hotline se cherche par téléphone.';
  return 'Aucune fiche rattachée, donc aucun numéro à chercher.';
}

function CoordonneesFiche({
  numero,
  indicatif,
  telephoneAffiche,
  email,
}: Readonly<{
  numero: string | null;
  indicatif?: string | null;
  telephoneAffiche: string | null;
  email?: string | null;
}>) {
  return (
    <>
      <span className="inline-flex items-center gap-1.5">
        <Phone aria-hidden className="size-3 shrink-0 text-muted-foreground" />
        {telephoneAffiche && numero ? (
          <a href={hrefTel(numero, indicatif)} className="font-medium text-foreground underline-offset-2 hover:underline">
            {telephoneAffiche}
          </a>
        ) : (
          <span className="text-muted-foreground">Aucun numéro</span>
        )}
      </span>
      <span className="inline-flex min-w-0 items-center gap-1.5">
        <Mail aria-hidden className="size-3 shrink-0 text-muted-foreground" />
        {email ? (
          <a href={`mailto:${email}`} className="truncate font-medium text-foreground underline-offset-2 hover:underline">
            {email}
          </a>
        ) : (
          <span className="text-muted-foreground">Aucun email</span>
        )}
      </span>
    </>
  );
}

export default function ActionDetailDialog({
  action,
  catalogue,
  onClose,
}: Readonly<{
  action: SuiviActionDto;
  catalogue: ColonneDto[];
  onClose: () => void;
}>) {
  const navigate = useNavigate();
  const [critereHotline, setCritereHotline] = useState<CritereHotline | null>(null);

  // `tiersId` n'arrive que parce que la liste le demande (`CLES_OUVERTURE_SUIVI_ACTION`).
  const prospect = useApi(() => (action.tiersId ? getProspect(action.tiersId) : Promise.resolve(null)), [action.tiersId]);
  const fiche = prospect.data ?? null;
  const nom = action.tiersNom || (fiche ? personDisplayName(fiche) : '') || 'Personne non identifiée';
  // Le mobile d'abord : c'est le numéro que la hotline retrouve le plus sûrement.
  const numero = fiche?.mobile || fiche?.telephone || null;
  const indicatif = fiche?.mobile ? fiche.indicatifMobile : fiche?.indicatifTelephone;
  const telephoneAffiche = numero ? formatTelephone(numero, indicatif) : null;

  // Hotline cherchée par numéro, jamais par nom : les homonymes sont courants.
  const critereDisponible: CritereHotline | null = numero ? { telephone: numero } : null;
  const hotlineEnAttente = !!action.tiersId && prospect.loading && !fiche;

  const sections = useMemo(() => {
    const rang = new Map(DISPOSITION_SUIVI_ACTIONS.ordre.map((n, i) => [n, i]));
    const masquees = DISPOSITION_SUIVI_ACTIONS.masquees ?? new Set<string>();
    const colonnes = [...catalogue]
      .filter((c) => !masquees.has(c.nom) && c.nom !== 'message')
      .sort((a, b) => (rang.get(a.nom) ?? 999) - (rang.get(b.nom) ?? 999));
    const parGroupe = new Map<string, { colonne: ColonneDto; valeur: string }[]>();
    for (const c of colonnes) {
      const valeur = formater(c, (action as unknown as Record<string, unknown>)[c.nom]);
      if (!valeur) continue;
      const liste = parGroupe.get(c.groupe) ?? [];
      liste.push({ colonne: c, valeur });
      parGroupe.set(c.groupe, liste);
    }
    return [...parGroupe.entries()];
  }, [action, catalogue]);

  const titre = [action.typeAction, action.tiersNom].filter(Boolean).join(' — ') || 'Action';

  let etatFiche;
  if (!action.tiersId) {
    etatFiche = <span className="text-muted-foreground">Aucune fiche rattachée à cette action.</span>;
  } else if (prospect.loading && !fiche) {
    etatFiche = <span className="text-muted-foreground">Chargement de la fiche…</span>;
  } else if (prospect.error && !fiche) {
    etatFiche = <span className="text-destructive">{prospect.error}</span>;
  } else {
    etatFiche = (
      <CoordonneesFiche numero={numero} indicatif={indicatif} telephoneAffiche={telephoneAffiche} email={fiche?.email} />
    );
  }

  return (
    <Modal title={titre} onClose={onClose} width={720}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-1.5 text-body text-muted-foreground">
          {action.dateAction && <span>{formatDateTime(action.dateAction)}</span>}
          {action.utilisateur && <span>· {action.utilisateur}</span>}
          {action.alerteActive && <Badge tone="warning">Alerte active</Badge>}
          {action.systeme && <Badge tone="neutral">Système</Badge>}
          {action.impaye && <Badge tone="amber">Impayé</Badge>}
        </div>

        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2.5 rounded-lg border border-border bg-muted/30 px-3.5 py-3">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <Avatar name={nom} />
            <div className="flex min-w-0 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-body font-semibold text-foreground">{nom}</span>
                {fiche?.code && <span className="text-micro text-muted-foreground">{fiche.code}</span>}
                {fiche?.type && <Badge tone="info">{fiche.type}</Badge>}
                {fiche?.estAncienClient && <Badge tone="success">Ancien client</Badge>}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-label">
                {etatFiche}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {action.tiersId && (
              <Button type="button" variant="ghost" size="sm" onClick={() => navigate(`/prospects/${action.tiersId}`)}>
                Fiche <ArrowUpRight data-icon="inline-end" />
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={hotlineEnAttente || !critereDisponible}
              title={titreBoutonHotline(hotlineEnAttente, critereDisponible !== null, !!action.tiersId, telephoneAffiche)}
              onClick={() => critereDisponible && setCritereHotline(critereDisponible)}
            >
              <Phone data-icon="inline-start" /> Voir hotline
            </Button>
          </div>
        </div>

        {action.message && (
          <section>
            <h3 className="mb-1.5 text-micro font-medium tracking-wide text-muted-foreground uppercase">Message</h3>
            <div className="rounded-lg border border-border bg-muted/40 px-3.5 py-3 text-body leading-relaxed whitespace-pre-wrap text-foreground">
              {action.message}
            </div>
          </section>
        )}

        {sections.length > 0 && (
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
            {sections.map(([groupe, champs]) => (
              <section key={groupe} className="min-w-0">
                <h3 className="mb-1.5 border-b border-border pb-1 text-micro font-medium tracking-wide text-muted-foreground uppercase">
                  {LIBELLES_GROUPE[groupe] ?? groupe}
                </h3>
                <dl className="grid grid-cols-1 gap-y-0.5 sm:grid-cols-[minmax(7rem,auto)_1fr] sm:gap-x-3">
                  {champs.map(({ colonne, valeur }) => (
                    <Fragment key={colonne.nom}>
                      <dt className="mt-1.5 text-micro text-muted-foreground first:mt-0 sm:mt-0 sm:py-0.5">{colonne.libelle}</dt>
                      <dd className="min-w-0 text-body break-words text-foreground sm:py-0.5">{valeur}</dd>
                    </Fragment>
                  ))}
                </dl>
              </section>
            ))}
          </div>
        )}

        {sections.length === 0 && !action.message && (
          <p className="text-body text-muted-foreground">Aucun champ renseigné sur cette ligne.</p>
        )}
      </div>

      <DialogFooter className="mt-5">
        <Button type="button" variant="outline" onClick={onClose}>Fermer</Button>
        {action.dossierId && (
          <Button type="button" variant="outline" onClick={() => navigate(`/dossiers/${action.dossierId}`)}>
            <Folder data-icon="inline-start" /> Ouvrir le dossier
          </Button>
        )}
        {action.prospectionId && (
          <Button type="button" onClick={() => navigate(`/prospections/${action.prospectionId}`)}>
            <Users data-icon="inline-start" /> Ouvrir la prospection
          </Button>
        )}
      </DialogFooter>

      {critereHotline && <HotlineResultDialog critere={critereHotline} onClose={() => setCritereHotline(null)} />}
    </Modal>
  );
}
