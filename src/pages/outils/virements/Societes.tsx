import { useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import DataGrid, { type ColonneGrille } from '../../../components/DataGrid';
import { Badge, EmptyState } from '../../../components/ui';
import { Button } from '../../../components/ui/button';
import { useConfirm } from '../../../lib/confirmContext';
import CadreVirements from './CadreVirements';
import { useNotification } from './useNotification';
import SocieteDialog from './SocieteDialog';
import { majVirements, useVirements, type Societe } from './donnees';

type LigneSociete = Societe & { nbOrdres: number };

/** Sociétés émettrices : identité bancaire et modèle de courrier de chacune. */
export default function Societes() {
  const { societes, ordres } = useVirements();
  const confirm = useConfirm();
  const [notification, notifier] = useNotification();
  const [edition, setEdition] = useState<Societe | 'nouvelle' | null>(null);

  const lignes = useMemo<LigneSociete[]>(
    () => societes.map((s) => ({ ...s, nbOrdres: ordres.filter((o) => o.societeId === s.id).length })),
    [societes, ordres],
  );

  async function supprimer(s: LigneSociete) {
    if (s.nbOrdres > 0) {
      notifier(`« ${s.nom} » a émis ${s.nbOrdres} ordre${s.nbOrdres > 1 ? 's' : ''} : elle ne peut pas être supprimée.`);
      return;
    }
    const ok = await confirm({
      title: 'Supprimer la société ?',
      message: `« ${s.nom} » ne sera plus proposée comme société émettrice.`,
      confirmLabel: 'Supprimer',
    });
    if (!ok) return;
    majVirements((e) => ({ ...e, societes: e.societes.filter((x) => x.id !== s.id) }));
    notifier(`« ${s.nom} » supprimée.`);
  }

  const colonnes = useMemo<ColonneGrille<LigneSociete>[]>(
    () => [
      {
        nom: 'logo',
        libelle: 'En-tête',
        largeur: 6,
        valeur: (r) => r.enteteMode,
        rendu: (r) =>
          r.enteteMode === 'aucun' ? (
            <span className="text-muted-foreground">Aucun</span>
          ) : (
            <span className="inline-flex h-4.5 items-center rounded-sm border border-border bg-muted px-1.5 text-micro font-bold tracking-tight text-foreground">
              {r.enteteMode === 'logo' ? r.nom.slice(0, 10) : 'Texte'}
            </span>
          ),
      },
      {
        nom: 'nom',
        libelle: 'Nom',
        largeur: 14,
        classe: 'font-medium text-foreground',
        rendu: (r) => (
          <span className="inline-flex items-center gap-1.5">
            {r.nom}
            {r.parDefaut && <Badge tone="info">Par défaut</Badge>}
          </span>
        ),
      },
      { nom: 'banque', libelle: 'Banque', largeur: 12 },
      { nom: 'ville', libelle: 'Ville', largeur: 9 },
      { nom: 'compte', libelle: 'Compte', largeur: 13, classe: 'font-mono text-muted-foreground' },
      { nom: 'signataire', libelle: 'Signataire', largeur: 13 },
      { nom: 'nbOrdres', libelle: 'Ordres', type: 'NOMBRE', largeur: 6 },
      {
        nom: 'actions',
        libelle: '',
        largeur: 6,
        rendu: (r) => (
          // La ligne s'ouvre au clic : les boutons ne doivent pas l'ouvrir en plus.
          <div className="flex items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
            <Button type="button" variant="ghost" size="icon-xs" title="Modifier" aria-label={`Modifier ${r.nom}`} onClick={() => setEdition(r)}>
              <Pencil />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              title="Supprimer"
              aria-label={`Supprimer ${r.nom}`}
              className="text-destructive hover:text-destructive"
              onClick={() => void supprimer(r)}
            >
              <Trash2 />
            </Button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps -- supprimer ne lit que des valeurs stables
    [],
  );

  return (
    <CadreVirements ecran="Sociétés" fullHeight>
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
        <p className="text-body text-muted-foreground">
          Nom, banque, ville, compte, signataire et logo sont imprimés tels quels sur le courrier envoyé à la banque.
        </p>
        <Button type="button" onClick={() => setEdition('nouvelle')}>
          <Plus data-icon="inline-start" /> Ajouter une société
        </Button>
      </div>

      {lignes.length === 0 ? (
        <EmptyState title="Aucune société" message="Ajoutez la société émettrice des ordres de virement." />
      ) : (
        <div className="min-h-0 min-w-0 flex-1 overflow-auto rounded-xl border border-border bg-card">
          <DataGrid
            rows={lignes}
            colonnes={colonnes}
            cleOrdre="outils-virements-societes"
            onOuvrir={(id) => setEdition(societes.find((s) => s.id === id) ?? null)}
            libelleLigne={(r) => `Modifier ${r.nom}`}
          />
        </div>
      )}

      {edition && (
        <SocieteDialog societe={edition === 'nouvelle' ? undefined : edition} onClose={() => setEdition(null)} notifier={notifier} />
      )}
      {notification}
    </CadreVirements>
  );
}
