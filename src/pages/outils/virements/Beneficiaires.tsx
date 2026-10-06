import { useMemo, useRef, useState } from 'react';
import { FolderOpen, Pencil, Plus, RotateCcw, Search, Trash2, Upload } from 'lucide-react';
import DataGrid, { type ColonneGrille } from '../../../components/DataGrid';
import { Badge, EmptyState } from '../../../components/ui';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { useConfirm } from '../../../lib/confirmContext';
import BeneficiaireDialog from './BeneficiaireDialog';
import CadreVirements, { ChoixSimple } from './CadreVirements';
import { useNotification } from './useNotification';
import DossierBeneficiaireDialog from './DossierBeneficiaireDialog';
import { LIBELLE_NATURE, etatDossier, majVirements, useVirements, type Beneficiaire, type NatureBeneficiaire } from './donnees';

type FiltreNature = 'tous' | NatureBeneficiaire;

const NATURE_FILTRE: { value: FiltreNature; label: string }[] = [
  { value: 'tous', label: 'Tous les bénéficiaires' },
  { value: 'fournisseur', label: 'Fournisseurs seulement' },
  { value: 'salarie', label: 'Salariés seulement' },
];

const IMPORT_ITEMS: { value: NatureBeneficiaire; label: string }[] = [
  { value: 'fournisseur', label: 'Importer des fournisseurs' },
  { value: 'salarie', label: 'Importer des salariés' },
];

type LigneBeneficiaire = Beneficiaire & { nbOrdres: number; total: number; aCompleter: number };

/** Bénéficiaires enregistrés — fournisseurs et salariés, un nom et un RIB.
 * Totaux et état du dossier calculés sur les ordres non annulés. */
export default function Beneficiaires() {
  const { beneficiaires, ordres } = useVirements();
  const confirm = useConfirm();
  const [notification, notifier] = useNotification();
  const [q, setQ] = useState('');
  const [nature, setNature] = useState<FiltreNature>('tous');
  const [natureImport, setNatureImport] = useState<NatureBeneficiaire>('fournisseur');
  const [edition, setEdition] = useState<Beneficiaire | 'nouveau' | null>(null);
  const [dossier, setDossier] = useState<Beneficiaire | null>(null);
  const fichier = useRef<HTMLInputElement>(null);

  const lignes = useMemo<LigneBeneficiaire[]>(() => {
    const terme = q.trim().toLowerCase();
    const compact = terme.replace(/\s/g, '');
    return beneficiaires
      .filter((b) => nature === 'tous' || b.nature === nature)
      .filter((b) => !terme || b.nom.toLowerCase().includes(terme) || (compact && b.rib.replace(/\s/g, '').includes(compact)))
      .map((b) => {
        const siens = ordres.filter((o) => o.beneficiaireId === b.id && o.statut !== 'annule');
        return {
          ...b,
          nbOrdres: siens.length,
          total: siens.reduce((s, o) => s + o.montant, 0),
          aCompleter: siens.filter((o) => !etatDossier(o).complet).length,
        };
      })
      .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
  }, [beneficiaires, ordres, q, nature]);

  async function supprimer(b: LigneBeneficiaire) {
    const ok = await confirm({
      title: 'Supprimer le bénéficiaire ?',
      message:
        b.nbOrdres > 0
          ? `« ${b.nom} » a ${b.nbOrdres} ordre${b.nbOrdres > 1 ? 's' : ''} dans l'historique : ils restent, mais il ne sera plus proposé dans le formulaire.`
          : `« ${b.nom} » ne sera plus proposé dans le formulaire.`,
      confirmLabel: 'Supprimer',
    });
    if (!ok) return;
    majVirements((s) => ({ ...s, beneficiaires: s.beneficiaires.filter((x) => x.id !== b.id) }));
    notifier(`« ${b.nom} » supprimé.`);
  }

  const colonnes = useMemo<ColonneGrille<LigneBeneficiaire>[]>(
    () => [
      { nom: 'nom', libelle: 'Nom', largeur: 20, classe: 'font-medium text-foreground' },
      {
        nom: 'nature',
        libelle: 'Nature',
        largeur: 8,
        valeur: (r) => LIBELLE_NATURE[r.nature],
        rendu: (r) => <Badge tone={r.nature === 'salarie' ? 'info' : 'neutral'}>{LIBELLE_NATURE[r.nature]}</Badge>,
      },
      { nom: 'rib', libelle: 'RIB', largeur: 20, classe: 'font-mono text-muted-foreground' },
      { nom: 'nbOrdres', libelle: 'Ordres', type: 'NOMBRE', largeur: 6 },
      { nom: 'total', libelle: 'Total viré', type: 'MONTANT', largeur: 11 },
      {
        nom: 'dossier',
        libelle: 'Dossier',
        largeur: 10,
        valeur: (r) => (r.nbOrdres === 0 ? '' : r.aCompleter === 0 ? 'Complet' : `${r.aCompleter} à compléter`),
        rendu: (r) =>
          r.nbOrdres === 0 ? (
            <span className="text-muted-foreground">—</span>
          ) : r.aCompleter === 0 ? (
            <Badge tone="success">Complet</Badge>
          ) : (
            <Badge tone="amber">{r.aCompleter} à compléter</Badge>
          ),
      },
      {
        nom: 'actions',
        libelle: '',
        largeur: 9,
        rendu: (r) => (
          <div className="flex items-center justify-end gap-0.5">
            <Button type="button" variant="ghost" size="icon-xs" title="Dossier" aria-label={`Dossier de ${r.nom}`} onClick={() => setDossier(r)}>
              <FolderOpen />
            </Button>
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

  const filtre = q.trim() !== '' || nature !== 'tous';

  return (
    <CadreVirements ecran="Bénéficiaires" fullHeight>
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search aria-hidden className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher un nom, un RIB…"
              aria-label="Rechercher un bénéficiaire"
              className="pl-8"
            />
          </div>
          <ChoixSimple items={NATURE_FILTRE} value={nature} onChange={setNature} className="w-48" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* La nature choisie s'applique à toutes les lignes du classeur,
              sauf celles qui portent leur propre colonne « type ». */}
          <ChoixSimple items={IMPORT_ITEMS} value={natureImport} onChange={setNatureImport} className="w-48" />
          <Button type="button" variant="outline" onClick={() => fichier.current?.click()}>
            <Upload data-icon="inline-start" /> Fichier Excel
          </Button>
          <input
            ref={fichier}
            type="file"
            accept=".xlsx,.xls,.csv"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) notifier(`Maquette : « ${f.name} » n'est pas importé (${LIBELLE_NATURE[natureImport].toLowerCase()}s).`);
              e.target.value = '';
            }}
          />
          <Button type="button" onClick={() => setEdition('nouveau')}>
            <Plus data-icon="inline-start" /> Ajouter un bénéficiaire
          </Button>
        </div>
      </div>

      <div className="shrink-0 text-body text-muted-foreground">
        {lignes.length} bénéficiaire{lignes.length > 1 ? 's' : ''}
      </div>

      {lignes.length === 0 ? (
        <EmptyState
          title={filtre ? 'Aucun résultat' : 'Aucun bénéficiaire'}
          message={filtre ? 'Aucun bénéficiaire ne correspond à la recherche.' : 'Ajoutez un fournisseur ou un salarié, ou importez un classeur.'}
          action={
            filtre ? (
              <Button type="button" variant="outline" size="sm" onClick={() => { setQ(''); setNature('tous'); }}>
                <RotateCcw data-icon="inline-start" /> Tout afficher
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="min-h-0 min-w-0 flex-1 overflow-auto rounded-xl border border-border bg-card">
          <DataGrid rows={lignes} colonnes={colonnes} cleOrdre="outils-virements-beneficiaires" />
        </div>
      )}

      {edition && (
        <BeneficiaireDialog
          beneficiaire={edition === 'nouveau' ? undefined : edition}
          onClose={() => setEdition(null)}
          notifier={notifier}
        />
      )}
      {dossier && <DossierBeneficiaireDialog beneficiaire={dossier} onClose={() => setDossier(null)} notifier={notifier} />}
      {notification}
    </CadreVirements>
  );
}
