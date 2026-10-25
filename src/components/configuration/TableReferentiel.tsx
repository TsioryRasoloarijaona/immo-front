import { useMemo, useState } from 'react';
import { Pencil, Plus, Trash2, Upload } from 'lucide-react';
import DataGrid, { type ColonneGrille } from '../DataGrid';
import ActionAdmin from '../patrimoine/ActionAdmin';
import { Badge, EmptyState, ErrorState, LoadingState, ResultsRegion } from '../ui';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import DialogueReferentiel from './DialogueReferentiel';
import FiltreSeuils from './FiltreSeuils';
import { listLignesReferentiel, supprimerLigneReferentiel } from '../../lib/apiReferentielsAdmin';
import { useAuth } from '../../lib/auth';
import { texteBrut } from '../../lib/format';
import { colonnesReferentiel } from '../../lib/colonnesReferentiel';
import { useConfirm } from '../../lib/confirmContext';
import { estAdministrateur } from '../../lib/roles';
import { estProtegee, filtresTranche, TOUTES, useChoixReferentiel, type LigneAvecId } from '../../lib/referentielsAdmin';
import { useToast } from '../../lib/toastContext';
import { useApi, useDebouncedValue } from '../../lib/useApi';
import type { DescripteurReferentielDto } from '../../types/referentielsAdmin';

/** Lignes d'un référentiel : lecture pour tous, création / modification / suppression pour l'Administrateur. */
export default function TableReferentiel({ descripteur }: Readonly<{ descripteur: DescripteurReferentielDto }>) {
  const { user } = useAuth();
  const admin = estAdministrateur(user);
  const confirm = useConfirm();
  const toast = useToast();
  const [recherche, setRecherche] = useState('');
  const [tranche, setTranche] = useState(TOUTES);
  const [dialogue, setDialogue] = useState<LigneAvecId | 'creation' | null>(null);
  const cherche = useDebouncedValue(recherche.trim());
  const choix = useChoixReferentiel(descripteur.champs);
  const { data, loading, error, refetch } = useApi(
    () => listLignesReferentiel(descripteur.slug, { search: cherche || undefined, ...filtresTranche(tranche) }),
    [descripteur.slug, cherche, tranche],
  );
  const lignes = data as LigneAvecId[] | null;
  const filtre = cherche !== '' || tranche !== TOUTES;
  const routeTranches = descripteur.champs.find((c) => c.nom === 'trancheId')?.choix;

  async function supprimer(l: LigneAvecId) {
    const ok = await confirm({
      title: 'Supprimer la ligne ?',
      message: `La ligne sera supprimée du référentiel « ${descripteur.libelle} ». Le serveur refuse si elle est utilisée ailleurs.`,
      confirmLabel: 'Supprimer',
    });
    if (!ok) return;
    try {
      await supprimerLigneReferentiel(descripteur.slug, l.id);
      toast('Ligne supprimée.');
      await refetch();
    } catch (err) {
      toast({ texte: err instanceof Error ? err.message : 'Échec de la suppression.', variante: 'erreur' });
    }
  }

  const colonnes = useMemo<ColonneGrille<LigneAvecId>[]>(() => {
    const base = colonnesReferentiel(descripteur.champs, choix);
    if (!admin) return base;
    return [...base, {
      nom: 'actions', libelle: 'Actions', largeur: 10, sansSomme: true,
      rendu: (l) => {
        const protegee = estProtegee(descripteur, l);
        return (
          <div className="flex items-center justify-end gap-1">
            {protegee && <Badge tone="neutral">Protégé</Badge>}
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Modifier la ligne" onClick={() => setDialogue(l)}><Pencil /></Button>
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Supprimer la ligne" disabled={protegee}
              title={protegee ? `Code protégé (${texteBrut(l.code)}) : suppression impossible.` : undefined}
              onClick={() => void supprimer(l)}>
              <Trash2 />
            </Button>
          </div>
        );
      },
    }];
    // eslint-disable-next-line react-hooks/exhaustive-deps -- supprimer ne dépend que de descripteur
  }, [descripteur, choix, admin]);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Input className="w-64" value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Rechercher…"
          aria-label={`Rechercher dans ${descripteur.libelle}`} />
        {descripteur.parTranche && <FiltreSeuils valeur={tranche} onChange={setTranche} tranches={choix[routeTranches ?? ''] ?? []} />}
        <div className="ml-auto flex gap-2">
          {descripteur.slug === 'types-presentation' && (
            <ActionAdmin to="/articles/import?type=presentations" libelle="Importer" variant="outline" icone={<Upload data-icon="inline-start" />} />
          )}
          <ActionAdmin libelle="Nouvelle ligne" icone={<Plus data-icon="inline-start" />} onClick={() => setDialogue('creation')} />
        </div>
      </div>
      {loading && !lignes && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!error && lignes && (
        <ResultsRegion loading={loading}>
          <div className="shrink-0 text-body text-muted-foreground">{lignes.length} ligne{lignes.length > 1 ? 's' : ''}</div>
          {lignes.length === 0 ? (
            <EmptyState title={filtre ? 'Aucun résultat' : 'Aucune ligne'}
              message={filtre ? 'Aucune ligne ne correspond à la recherche.' : 'Ce référentiel est vide.'} />
          ) : (
            <div className="min-h-0 min-w-0 flex-1 overflow-auto rounded-xl border border-border bg-card">
              <DataGrid cleOrdre={`ref-${descripteur.slug}`} rows={lignes} colonnes={colonnes} />
            </div>
          )}
        </ResultsRegion>
      )}
      {dialogue && (
        <DialogueReferentiel descripteur={descripteur} ligne={dialogue === 'creation' ? undefined : dialogue} choix={choix}
          onClose={() => setDialogue(null)}
          onSaved={() => { setDialogue(null); toast('Enregistré.'); void refetch(); }} />
      )}
    </div>
  );
}
