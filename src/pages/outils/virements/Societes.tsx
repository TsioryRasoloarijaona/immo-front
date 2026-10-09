import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import DataGrid, { type ColonneGrille } from '../../../components/DataGrid';
import { Badge, EmptyState, ErrorState, LoadingState, ResultsRegion } from '../../../components/ui';
import { Button } from '../../../components/ui/button';
import { useApi } from '../../../lib/useApi';
import { ErreurVirement, lienLogoSociete, listerSocietes, supprimerSociete } from '../../../lib/virements';
import CadreVirements, { type ContexteCharge } from './CadreVirements';
import { rafraichir } from './contexte';
import SocieteDialog from './SocieteDialog';
import type { Societe } from './types';
import { useConfirmation } from './useConfirmation';
import { useNotification } from './useNotification';

type Ligne = { id: string; s: Societe };

export default function Societes() {
  return (
    <CadreVirements ecran="Sociétés" fullHeight adminSeulement>
      {(ctx) => <ListeSocietes ctx={ctx} />}
    </CadreVirements>
  );
}

function Vignette({ s }: Readonly<{ s: Societe }>) {
  if (s.entete_mode === 'logo' && s.logo) {
    return <img src={lienLogoSociete(s.id, s.updated_at)} alt={`Logo ${s.nom}`} className="h-4.5 max-w-24 object-contain" />;
  }
  let texte = 'sans en-tête';
  if (s.entete_mode === 'logo') texte = 'logo GHRIZA';
  else if (s.entete_mode === 'texte') texte = 'en-tête texte';
  return <span className="text-micro text-muted-foreground">{texte}</span>;
}

/** L'ordre est celui du serveur (société par défaut d'abord, puis par nom) : ne pas retrier. */
function ListeSocietes({ ctx }: Readonly<{ ctx: ContexteCharge }>) {
  const toasts = useNotification();
  const [confirmation, demander] = useConfirmation();
  const { data, loading, error } = useApi(listerSocietes, [ctx.revision]);
  const [edition, setEdition] = useState<Societe | 'nouvelle' | null>(null);

  async function supprimer(s: Societe) {
    const ok = await demander({
      titre: 'Supprimer la société ?',
      message: `« ${s.nom} » ne sera plus proposée comme société émettrice.`,
      confirmer: 'Supprimer',
      danger: true,
    });
    if (!ok) return;
    try {
      await supprimerSociete(s.id);
    } catch (e) {
      // Deux 409 : la dernière société (refus définitif), ou une société qui a émis des ordres (seconde confirmation).
      if (!(e instanceof ErreurVirement && e.status === 409 && e.erreur.includes('ordre(s)'))) {
        toasts.notifierErreur(e, 'Impossible de supprimer la société');
        return;
      }
      const encore = await demander({
        titre: 'Cette société a émis des ordres',
        message: `${e.erreur.charAt(0).toUpperCase()}${e.erreur.slice(1)}. Ces ordres resteront dans l'historique au nom de « ${s.nom} », mais la société ne sera plus proposée.`,
        confirmer: 'Supprimer quand même',
        danger: true,
      });
      if (!encore) return;
      try {
        await supprimerSociete(s.id, true);
      } catch (e2) {
        toasts.notifierErreur(e2, 'Impossible de supprimer la société');
        return;
      }
    }
    rafraichir();
    toasts.notifier(`Société « ${s.nom} » supprimée avec succès.`);
  }

  const lignes: Ligne[] = (data ?? []).map((s) => ({ id: String(s.id), s }));
  const colonnes: ColonneGrille<Ligne>[] = [
    { nom: 'logo', libelle: 'Logo', largeur: 8, valeur: (r) => r.s.entete_mode, rendu: (r) => <Vignette s={r.s} /> },
    {
      nom: 'nom',
      libelle: 'Nom',
      largeur: 14,
      classe: 'font-medium text-foreground',
      valeur: (r) => r.s.nom,
      rendu: (r) => (
        <span className="inline-flex items-center gap-1.5">
          {r.s.nom}
          {r.s.par_defaut ? <Badge tone="info">Par défaut</Badge> : null}
        </span>
      ),
    },
    { nom: 'banque', libelle: 'Banque', largeur: 11, valeur: (r) => r.s.banque },
    { nom: 'ville', libelle: 'Ville', largeur: 9, valeur: (r) => r.s.ville },
    { nom: 'compte', libelle: 'Compte', largeur: 13, classe: 'font-mono text-muted-foreground', valeur: (r) => r.s.compte },
    { nom: 'signataire', libelle: 'Signataire', largeur: 13, valeur: (r) => r.s.signataire },
    { nom: 'nb_ordres', libelle: 'Ordres', type: 'NOMBRE', largeur: 6, valeur: (r) => r.s.nb_ordres ?? 0 },
    {
      nom: 'actions',
      libelle: '',
      largeur: 6,
      rendu: (r) => (
        // La ligne s'ouvre au clic : les boutons ne doivent pas l'ouvrir en plus.
        <div role="presentation" className="flex items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <Button type="button" variant="ghost" size="icon-xs" title="Modifier" aria-label={`Modifier ${r.s.nom}`} onClick={() => setEdition(r.s)}>
            <Pencil />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            title="Supprimer"
            aria-label={`Supprimer ${r.s.nom}`}
            className="text-destructive hover:text-destructive"
            onClick={() => void supprimer(r.s)}
          >
            <Trash2 />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
        <p className="text-body text-muted-foreground">
          Nom, banque, ville, numéro de compte, signataire et logo de chaque société sont imprimés tels quels sur le courrier envoyé à la
          banque.
        </p>
        <Button type="button" onClick={() => setEdition('nouvelle')}>
          <Plus data-icon="inline-start" /> Ajouter une société
        </Button>
      </div>

      {error && !data && <ErrorState message={error} />}
      {!error && !data && <LoadingState />}
      {data && lignes.length === 0 && (
        <EmptyState title="Aucune société" message="Ajoutez la société émettrice des ordres de virement." />
      )}
      {data && lignes.length > 0 && (
        <ResultsRegion loading={loading}>
          <div className="min-h-0 min-w-0 flex-1 overflow-auto rounded-xl border border-border bg-card">
            <DataGrid
              rows={lignes}
              colonnes={colonnes}
              cleOrdre="outils-virements-societes"
              onOuvrir={(id) => setEdition(data.find((s) => String(s.id) === id) ?? null)}
              libelleLigne={(r) => `Modifier ${r.s.nom}`}
            />
          </div>
        </ResultsRegion>
      )}

      {edition && (
        <SocieteDialog
          societe={edition === 'nouvelle' ? undefined : edition}
          premiere={(data ?? []).length === 0}
          onClose={() => setEdition(null)}
          toasts={toasts}
        />
      )}
      {confirmation}
      {toasts.noeud}
    </>
  );
}
