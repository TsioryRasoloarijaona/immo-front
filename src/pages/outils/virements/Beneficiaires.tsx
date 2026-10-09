import { useMemo, useRef, useState } from 'react';
import { FolderOpen, Pencil, Plus, RotateCcw, Search, Trash2, Upload } from 'lucide-react';
import DataGrid, { type ColonneGrille } from '../../../components/DataGrid';
import { Badge, EmptyState, ErrorState, LoadingState, ResultsRegion } from '../../../components/ui';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { useApi } from '../../../lib/useApi';
import { ErreurVirement, importerBeneficiaires, listerDossiers, supprimerBeneficiaire } from '../../../lib/virements';
import BeneficiaireDialog from './BeneficiaireDialog';
import CadreVirements, { ChoixSimple, type ContexteCharge } from './CadreVirements';
import { rafraichir } from './contexte';
import { normaliser, pluriel } from './donnees';
import DossierBeneficiaireDialog from './DossierBeneficiaireDialog';
import OrdreDetailDialog from './OrdreDetailDialog';
import type { LigneDossier, TypeBeneficiaire } from './types';
import { useConfirmation } from './useConfirmation';
import { useNotification } from './useNotification';

type FiltreNature = 'tous' | TypeBeneficiaire;
type Ligne = { id: string; b: LigneDossier };

export default function Beneficiaires() {
  return (
    <CadreVirements ecran="Bénéficiaires" fullHeight>
      {(ctx) => <Carnet ctx={ctx} />}
    </CadreVirements>
  );
}

/** Bénéficiaires (§9) : `GET /dossiers` chargé en entier, recherche et filtre
 * faits à l'écran. Les chiffres (ordres, total viré, dossiers) sont ceux du
 * serveur. */
interface CompteDossier {
  nb_ordres: number;
  nb_incomplets: number;
}

function libelleDossier(b: CompteDossier): string {
  if (b.nb_ordres === 0) return 'Aucun virement';
  return b.nb_incomplets === 0 ? 'Complet' : `${b.nb_incomplets} à compléter`;
}

function EtatDossier({ b }: Readonly<{ b: CompteDossier }>) {
  if (b.nb_ordres === 0) return <span className="text-muted-foreground">Aucun virement</span>;
  if (b.nb_incomplets === 0) return <Badge tone="success">Complet</Badge>;
  return <Badge tone="amber">{b.nb_incomplets} à compléter</Badge>;
}

function Carnet({ ctx }: Readonly<{ ctx: ContexteCharge }>) {
  const { meta, moi, revision } = ctx;
  const toasts = useNotification();
  const [confirmation, demander] = useConfirmation();
  const { data, loading, error } = useApi(listerDossiers, [revision]);
  const [q, setQ] = useState('');
  const [nature, setNature] = useState<FiltreNature>('tous');
  const [natureImport, setNatureImport] = useState<TypeBeneficiaire>('fournisseur');
  const [importEnCours, setImportEnCours] = useState(false);
  const [edition, setEdition] = useState<LigneDossier | 'nouveau' | null>(null);
  const [dossier, setDossier] = useState<LigneDossier | null>(null);
  const [ordreOuvert, setOrdreOuvert] = useState<number | null>(null);
  const fichier = useRef<HTMLInputElement>(null);

  const natures = Object.entries(meta.types_beneficiaire) as [TypeBeneficiaire, string][];
  const filtreItems: { value: FiltreNature; label: string }[] = [
    { value: 'tous', label: 'Tous' },
    ...natures.map(([v, l]) => ({ value: v, label: `${l}s seulement` })),
  ];
  const importItems = natures.map(([v, l]) => ({ value: v, label: `Importer des ${l.toLowerCase()}s` }));

  // « hamid enne » trouve « M Hamid ENNEASSI » : chaque mot tapé doit figurer
  // dans le nom ou le RIB (RIB comparé sans espaces).
  const lignes = useMemo<Ligne[]>(() => {
    const mots = normaliser(q).split(/\s+/).filter(Boolean);
    return (data ?? [])
      .filter((b) => nature === 'tous' || b.type === nature)
      .filter((b) => {
        const nom = normaliser(b.nom);
        const rib = b.rib.replace(/\s/g, '').toLowerCase();
        return mots.every((m) => nom.includes(m) || rib.includes(m));
      })
      .map((b) => ({ id: String(b.id), b }));
  }, [data, q, nature]);

  async function supprimer(b: LigneDossier) {
    const ok = await demander({
      titre: 'Supprimer le bénéficiaire ?',
      message: `« ${b.nom} » ne sera plus proposé dans le formulaire.`,
      confirmer: 'Supprimer',
      danger: true,
    });
    if (!ok) return;
    try {
      await supprimerBeneficiaire(b.id);
    } catch (e) {
      if (!(e instanceof ErreurVirement && e.status === 409)) {
        toasts.notifierErreur(e, 'Impossible de supprimer le bénéficiaire');
        return;
      }
      // Second temps : il a des ordres (§9.3).
      const encore = await demander({
        titre: 'Ce bénéficiaire a des ordres',
        message: `${e.erreur.charAt(0).toUpperCase()}${e.erreur.slice(1)}. Ces ordres resteront dans l'historique avec le nom et le RIB d'origine, mais le bénéficiaire ne sera plus proposé dans le formulaire.`,
        confirmer: 'Supprimer quand même',
        danger: true,
      });
      if (!encore) return;
      try {
        await supprimerBeneficiaire(b.id, true);
      } catch (e2) {
        toasts.notifierErreur(e2, 'Impossible de supprimer le bénéficiaire');
        return;
      }
    }
    rafraichir();
    toasts.notifier(`Bénéficiaire « ${b.nom} » supprimé avec succès.`);
  }

  async function importer(f: File) {
    setImportEnCours(true);
    try {
      const r = await importerBeneficiaires(f, natureImport);
      rafraichir();
      const libelle = `${meta.types_beneficiaire[natureImport] ?? natureImport}s`;
      toasts.notifier(
        `${libelle} : ${r['importés']} importé(s), ${r.mis_a_jour} mis à jour, ${r['ignorés']} ignoré(s).`,
        r.erreurs.length > 0 ? 'avertissement' : 'succes',
      );
    } catch (e) {
      toasts.notifierErreur(e, "Impossible d'importer le fichier");
    } finally {
      setImportEnCours(false);
    }
  }

  const colonnes: ColonneGrille<Ligne>[] = [
    { nom: 'nom', libelle: 'Nom', largeur: 20, classe: 'font-medium text-foreground', valeur: (r) => r.b.nom },
    {
      nom: 'nature',
      libelle: 'Nature',
      largeur: 8,
      valeur: (r) => meta.types_beneficiaire[r.b.type] ?? r.b.type,
      rendu: (r) => <Badge tone={r.b.type === 'salarie' ? 'info' : 'neutral'}>{meta.types_beneficiaire[r.b.type] ?? r.b.type}</Badge>,
    },
    { nom: 'rib', libelle: 'RIB', largeur: 20, classe: 'font-mono text-muted-foreground', valeur: (r) => r.b.rib },
    { nom: 'nb_ordres', libelle: 'Ordres', type: 'NOMBRE', largeur: 6, valeur: (r) => r.b.nb_ordres },
    { nom: 'total_montant', libelle: 'Total viré', type: 'MONTANT', largeur: 11, sansSomme: true, valeur: (r) => r.b.total_montant },
    {
      nom: 'dossier',
      libelle: 'Dossier',
      largeur: 10,
      valeur: (r) => libelleDossier(r.b),
      rendu: (r) => <EtatDossier b={r.b} />,
    },
    {
      nom: 'actions',
      libelle: '',
      largeur: 9,
      rendu: (r) => (
        <div className="flex items-center justify-end gap-0.5">
          <Button type="button" variant="ghost" size="icon-xs" title="Dossier" aria-label={`Dossier de ${r.b.nom}`} onClick={() => setDossier(r.b)}>
            <FolderOpen />
          </Button>
          <Button type="button" variant="ghost" size="icon-xs" title="Modifier" aria-label={`Modifier ${r.b.nom}`} onClick={() => setEdition(r.b)}>
            <Pencil />
          </Button>
          {moi.admin && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              title="Supprimer"
              aria-label={`Supprimer ${r.b.nom}`}
              className="text-destructive hover:text-destructive"
              onClick={() => void supprimer(r.b)}
            >
              <Trash2 />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const vide =
    q.trim() !== ''
      ? `Aucun bénéficiaire ne correspond à « ${q.trim()} »`
      : nature !== 'tous'
        ? 'Aucun bénéficiaire de cette nature'
        : 'Aucun bénéficiaire enregistré';

  return (
    <>
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search aria-hidden className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom ou RIB" aria-label="Rechercher un bénéficiaire" className="pl-8" />
          </div>
          <ChoixSimple items={filtreItems} value={nature} onChange={setNature} className="w-48" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* La nature choisie s'applique aux lignes du classeur qui ne
              portent pas leur propre colonne « type ». */}
          <ChoixSimple items={importItems} value={natureImport} onChange={setNatureImport} className="w-52" />
          <Button type="button" variant="outline" disabled={importEnCours} onClick={() => fichier.current?.click()}>
            <Upload data-icon="inline-start" /> {importEnCours ? 'Import…' : 'Fichier Excel'}
          </Button>
          <input
            ref={fichier}
            type="file"
            accept=".xlsx,.xls,.csv"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (f) void importer(f);
            }}
          />
          <Button type="button" onClick={() => setEdition('nouveau')}>
            <Plus data-icon="inline-start" /> Ajouter un bénéficiaire
          </Button>
        </div>
      </div>

      {error && !data ? (
        <ErrorState message={error} />
      ) : !data ? (
        <LoadingState />
      ) : (
        <ResultsRegion loading={loading}>
          <div className="shrink-0 text-body text-muted-foreground">{pluriel(lignes.length, 'bénéficiaire')}</div>
          {lignes.length === 0 ? (
            <EmptyState
              title={vide}
              action={
                q.trim() !== '' || nature !== 'tous' ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setQ('');
                      setNature('tous');
                    }}
                  >
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
        </ResultsRegion>
      )}

      {edition && (
        <BeneficiaireDialog
          beneficiaire={edition === 'nouveau' ? undefined : edition}
          natureParDefaut={nature === 'tous' ? 'fournisseur' : nature}
          meta={meta}
          onClose={() => setEdition(null)}
          toasts={toasts}
        />
      )}
      {dossier && (
        <DossierBeneficiaireDialog
          beneficiaire={dossier}
          onClose={() => setDossier(null)}
          onOuvrirOrdre={(id) => {
            setDossier(null);
            setOrdreOuvert(id);
          }}
        />
      )}
      {ordreOuvert !== null && <OrdreDetailDialog ordreId={ordreOuvert} meta={meta} moi={moi} onClose={() => setOrdreOuvert(null)} toasts={toasts} />}
      {confirmation}
      {toasts.noeud}
    </>
  );
}
