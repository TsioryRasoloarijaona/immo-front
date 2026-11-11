import { useState, type ReactNode } from 'react';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import BarreIcones from '../BarreIcones';
import DataGrid, { type ColonneGrille } from '../DataGrid';
import SearchableSelect from '../SearchableSelect';
import { EmptyState, ErrorState, LoadingState } from '../ui';
import { Button } from '../ui/button';
import { Field, FieldLabel } from '../ui/field';
import { Input } from '../ui/input';
import { useConfirm } from '../../lib/confirmContext';
import { brouillonDepuis, corpsDepuis, useSaisie, type ChampDef, type Choix } from '../../lib/saisiePatrimoine';
import { useToast } from '../../lib/toastContext';
import type { ApiState } from '../../lib/useApi';

interface Props<T extends { id: string }> {
  champs: ChampDef[];
  /** Choix des champs `liste`, par nom de champ. */
  choix: Record<string, Choix>;
  lignes: ApiState<T[]>;
  colonnes: ColonneGrille<T>[];
  vide: string;
  libelleLigne: (ligne: T) => string;
  /** `ligne` absente = ajout. L'erreur 400/409 du serveur s'affiche sous le formulaire. */
  enregistrer: (corps: Record<string, unknown>, ligne: T | null) => Promise<unknown>;
  supprimer: (ligne: T) => Promise<unknown>;
  /** Boutons d'action supplémentaires de la barre (import…). */
  barre?: ReactNode;
  /** Sous la grille (total…). */
  pied?: ReactNode;
}

function FormulaireLigne<T extends { id: string }>({ champs, choix, ligne, enregistrer, onFerme }: Readonly<{
  champs: ChampDef[];
  choix: Record<string, Choix>;
  ligne: T | null;
  enregistrer: Props<T>['enregistrer'];
  onFerme: () => void;
}>) {
  const [depart] = useState(() => brouillonDepuis(champs, ligne ?? undefined));
  const { brouillon, modifier, envoi, erreur, envoyer } = useSaisie(champs, depart);

  function valider(e: React.SyntheticEvent) {
    e.preventDefault();
    void envoyer(() => enregistrer(corpsDepuis(champs, brouillon), ligne), onFerme);
  }

  return (
    <form onSubmit={valider} className="flex flex-wrap items-end gap-2.5 rounded-lg border border-border p-2.5">
      {champs.map((c) => (
        <Field key={c.nom} className={c.type === 'texte' ? 'min-w-48 flex-1' : 'w-48'}>
          <FieldLabel htmlFor={`ligne-${c.nom}`}>{c.libelle}{c.obligatoire ? ' *' : ''}</FieldLabel>
          {c.type === 'liste' ? (
            <SearchableSelect id={`ligne-${c.nom}`} items={choix[c.nom] ?? []} value={String(brouillon[c.nom]) || null}
              placeholder="Choisir…" emptyMessage="Aucun choix" className="w-full min-w-0"
              onValueChange={(v) => modifier(c.nom, v ?? '')} />
          ) : (
            <Input id={`ligne-${c.nom}`} type={c.type === 'texte' ? 'text' : 'number'} step="any" min={0}
              value={String(brouillon[c.nom])} onChange={(e) => modifier(c.nom, e.target.value)} />
          )}
        </Field>
      ))}
      <BarreIcones className="flex items-center gap-1">
        <Button type="submit" size="sm" disabled={envoi}><Check /> Enregistrer</Button>
        <Button type="button" variant="outline" size="sm" onClick={onFerme} disabled={envoi}><X /> Annuler</Button>
      </BarreIcones>
      {erreur && <p className="w-full text-body text-destructive">{erreur}</p>}
    </form>
  );
}

/** Grille d'un onglet de la fiche projet (ventilation, critères) : ajout / modification en ligne, suppression confirmée. */
export default function OngletLignesProjet<T extends { id: string }>({
  champs, choix, lignes, colonnes, vide, libelleLigne, enregistrer, supprimer, barre, pied,
}: Readonly<Props<T>>) {
  const confirm = useConfirm();
  const toast = useToast();
  const [edition, setEdition] = useState<T | 'ajout' | null>(null);
  const { data, loading, error, refetch } = lignes;

  async function retirer(ligne: T) {
    const ok = await confirm({
      title: 'Supprimer la ligne ?',
      message: `« ${libelleLigne(ligne)} » sera supprimée.`,
      confirmLabel: 'Supprimer',
    });
    if (!ok) return;
    try {
      await supprimer(ligne);
      toast('Ligne supprimée.');
    } catch (err) {
      toast({ texte: err instanceof Error ? err.message : 'Échec de la suppression.', variante: 'erreur' });
    }
    await refetch();
  }

  function apresEnregistrement() {
    setEdition(null);
    void refetch();
  }

  return (
    <div className="flex flex-col gap-2.5">
      <BarreIcones className="flex items-center gap-1">
        <Button type="button" variant="ghost" size="sm" onClick={() => setEdition('ajout')}><Plus /> Ajouter</Button>
        {barre}
      </BarreIcones>
      {edition && (
        <FormulaireLigne key={edition === 'ajout' ? 'ajout' : edition.id} champs={champs} choix={choix}
          ligne={edition === 'ajout' ? null : edition} onFerme={apresEnregistrement}
          enregistrer={async (corps, ligne) => { await enregistrer(corps, ligne); }} />
      )}
      {loading && !data && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!error && data && (data.length === 0 ? (
        <EmptyState title={vide} />
      ) : (
        <div className="max-h-72 overflow-auto rounded-xl border border-border bg-card">
          <DataGrid rows={data} colonnes={colonnes} bandeauRegroupement={false} libelleLigne={libelleLigne}
            actions={(l) => (
              <BarreIcones className="flex items-center justify-center gap-1">
                <Button type="button" variant="ghost" size="sm" onClick={() => setEdition(l)}><Pencil /> Modifier</Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => void retirer(l)}><Trash2 /> Supprimer</Button>
              </BarreIcones>
            )} />
        </div>
      ))}
      {!error && data && pied}
    </div>
  );
}
