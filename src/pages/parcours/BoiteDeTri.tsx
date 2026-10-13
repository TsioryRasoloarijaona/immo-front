import { useEffect, useRef, useState } from 'react';
import { Inbox, LoaderCircle, RotateCcw } from 'lucide-react';
import PageShell from '../../components/PageShell';
import InteractionForm from '../../components/InteractionForm';
import CreateProspectForm from '../../components/CreateProspectForm';
import TransformerProspectionDialog from '../../components/TransformerProspectionDialog';
import ArchiverProspectionDialog from '../../components/ArchiverProspectionDialog';
import CarteTri from '../../components/parcours/CarteTri';
import GestesTri, { type GesteTri } from '../../components/parcours/GestesTri';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { addInteraction, archiverProspection, listBoiteDeTri, marquerInjoignable, transformerProspection } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { useAuth } from '../../lib/auth';
import { useAppData, commercialLabel } from '../../lib/appData';
import { lienAppel, typeActionDuCanal, type CanalContact } from '../../lib/contact';
import { formatNumber, pluriel } from '../../lib/format';
import { useTypesContactProspection } from '../../lib/referentiels';
import { useToast } from '../../lib/toastContext';
import type { LigneTriDto } from '../../types';

const TAILLE_FILE = 50;
const TOUCHES: Partial<Record<string, GesteTri>> ={ '1': 'contact', '2': 'injoignable', '3': 'qualifier', '4': 'archiver' };
/** `canal` : bouton Appeler / WhatsApp cliqué avant « noter l'échange », pour présélectionner le type d'action. */
type Boite = { type: 'interaction' | 'creerProspect' | 'transformer' | 'archiver'; ligne: LigneTriDto; canal?: CanalContact };

function saisieEnCours(cible: EventTarget | null): boolean {
  return cible instanceof HTMLElement && (cible.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(cible.tagName));
}

/** Boîte de tri : une pré-prospection à la fois, raccourcis 1 à 4 (FEATURE-parcours-commercial.md §4). */
export default function BoiteDeTri() {
  const { user } = useAuth();
  const { commerciaux } = useAppData();
  const showToast = useToast();
  const typesAction = useTypesContactProspection();
  const [toutes, setToutes] = useState(false);
  const [index, setIndex] = useState(0);
  const [traites, setTraites] = useState(0);
  const [boite, setBoite] = useState<Boite | null>(null);
  const [busy, setBusy] = useState(false);
  // Verrou synchrone : un 2e clic ou une touche répétée arrive avant que `busy` ne grise l'écran.
  const enCours = useRef(false);
  const apresCreation = useRef<LigneTriDto | null>(null);

  const file = useApi(() => listBoiteDeTri(toutes, { page: 0, size: TAILLE_FILE }), [toutes], 'boite-de-tri');
  const lignes = file.data?.content ?? [];
  const ligne = lignes.at(index) ?? null;
  const total = file.data?.totalElements ?? 0;
  const restants = Math.max(0, total - index);
  const progression = traites + restants > 0 ? Math.round((traites / (traites + restants)) * 100) : 0;
  const ownCommercial = commerciaux.find((c) => c.id === user?.employeeId) ?? null;

  /** Toute ligne traitée quitte la boîte côté serveur : la relecture amène la suivante au même rang. */
  async function suivante(message: string) {
    setTraites((t) => t + 1);
    await file.refetch();
    showToast(message);
  }

  function geste(g: GesteTri, l: LigneTriDto, canal?: CanalContact) {
    if (enCours.current) return;
    if (g === 'contact') {
      setBoite({ type: 'interaction', ligne: l, canal });
    } else if (g === 'injoignable') {
      enCours.current = true;
      setBusy(true);
      marquerInjoignable(l.prospectionId)
        .then(() => suivante(`${l.nom ?? 'Lead'} : relance demain à 10:00, dans Ma journée.`))
        .catch((err: unknown) => showToast({ texte: err instanceof Error ? err.message : 'Échec.', variante: 'erreur' }))
        .finally(() => {
          enCours.current = false;
          setBusy(false);
        });
    } else if (g === 'qualifier') {
      setBoite({ type: l.prospectId ? 'transformer' : 'creerProspect', ligne: l });
    } else {
      setBoite({ type: 'archiver', ligne: l });
    }
  }

  useEffect(() => {
    function surTouche(e: KeyboardEvent) {
      const g = TOUCHES[e.key];
      if (!g || !ligne || boite || busy || e.ctrlKey || e.metaKey || e.altKey || saisieEnCours(e.target)) return;
      e.preventDefault();
      // Au clavier, « 1 » compose aussi le numéro ; au clic, c'est le lien lui-même qui l'a fait.
      const appel = g === 'contact' ? lienAppel(ligne.telephone) : null;
      if (appel) globalThis.location.assign(appel);
      geste(g, ligne, appel ? 'appel' : undefined);
    }
    globalThis.addEventListener('keydown', surTouche);
    return () => globalThis.removeEventListener('keydown', surTouche);
  });

  const nomLigne = (l: LigneTriDto) => l.nom || l.code || 'Lead';

  return (
    <PageShell
      title="Boîte de tri"
      crumbs={[{ label: 'Ventes' }, { label: 'Boîte de tri' }]}
      icon={<Inbox />}
      accent="var(--sec-preprospection)"
      accentBg="var(--sec-preprospection-bg)"
      actions={
        <label className="flex items-center gap-2 text-body text-muted-foreground">
          <input
            type="checkbox"
            className="size-3.5 accent-(--brand)"
            checked={toutes}
            onChange={(e) => {
              setToutes(e.target.checked);
              setIndex(0);
            }}
          />
          Inclure les leads de plus de 6 mois
        </label>
      }
    >
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 pt-1">
        {file.error && <ErrorState message={file.error} />}
        {!file.error && !file.data && <LoadingState />}
        {!file.error && file.data && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 text-body text-muted-foreground">
              <span>
                {ligne ? `Lead ${formatNumber(index + 1)} sur ${formatNumber(total)} · le plus récent d'abord` : pluriel(total, 'lead') + ' à trier'}
              </span>
              <span className="hidden sm:inline">Raccourcis clavier : <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> <kbd>4</kbd></span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="Progression du tri" aria-valuenow={progression} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${progression}%` }} />
            </div>
            {ligne ? (
              <>
                {busy && (
                  <p role="status" className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-body text-foreground">
                    <LoaderCircle aria-hidden className="size-4 animate-spin" />
                    Enregistrement en cours… le lead suivant arrive dès que le serveur a répondu.
                  </p>
                )}
                <div aria-busy={busy} className={busy ? 'pointer-events-none flex flex-col gap-3 opacity-60' : 'flex flex-col gap-3'}>
                  <CarteTri ligne={ligne} />
                  <GestesTri ligne={ligne} busy={busy} onGeste={(g, canal) => geste(g, ligne, canal)} />
                </div>
              </>
            ) : (
              <EmptyState
                title="Rien à trier"
                message={total > 0 ? 'Vous êtes allé au bout de la file chargée.' : 'Aucune pré-prospection en attente : bravo.'}
                action={total > 0 ? <Button type="button" variant="outline" size="sm" onClick={() => setIndex(0)}><RotateCcw data-icon="inline-start" /> Reprendre au début</Button> : undefined}
              />
            )}
          </>
        )}
      </div>

      {boite?.type === 'interaction' && (
        <InteractionForm
          initialActionTypeId={typeActionDuCanal(typesAction.data, boite.canal)}
          onClose={() => setBoite(null)}
          onSubmit={async (input) => {
            await addInteraction(boite.ligne.prospectionId, input);
            await suivante('Échange noté.');
          }}
        />
      )}
      {boite?.type === 'creerProspect' && (
        <CreateProspectForm
          preProspectionId={boite.ligne.prospectionId}
          initial={{
            firstName: nomLigne(boite.ligne).trim().split(' ')[0],
            lastName: nomLigne(boite.ligne).trim().split(' ').slice(1).join(' '),
            phone: boite.ligne.telephone ?? '',
            email: boite.ligne.email ?? '',
          }}
          onClose={() => {
            const l = apresCreation.current;
            apresCreation.current = null;
            setBoite(l ? { type: 'transformer', ligne: l } : null);
          }}
          onSubmit={(maj) => {
            apresCreation.current = { ...boite.ligne, prospectId: maj.prospectId ?? null };
          }}
        />
      )}
      {boite?.type === 'transformer' && (
        <TransformerProspectionDialog
          initialCommercialId={ownCommercial?.id ?? null}
          initialTrancheId={boite.ligne.trancheId ?? null}
          initialArticleId={null}
          commercialItems={commerciaux.map((c) => ({ label: commercialLabel(c), value: c.id }))}
          onClose={() => setBoite(null)}
          onSubmit={async (body) => {
            await transformerProspection(boite.ligne.prospectionId, body);
            await suivante(`${nomLigne(boite.ligne)} est maintenant une prospection.`);
          }}
        />
      )}
      {boite?.type === 'archiver' && (
        <ArchiverProspectionDialog
          titre={nomLigne(boite.ligne)}
          raisonProposee={boite.ligne.doublons.length > 0 ? 'PROSPECTION EN DOUBLE' : undefined}
          onClose={() => setBoite(null)}
          onSubmit={async (body) => {
            await archiverProspection(boite.ligne.prospectionId, body);
            await suivante(`${nomLigne(boite.ligne)} archivé.`);
          }}
        />
      )}
    </PageShell>
  );
}
