import { useState, type DragEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Download, FileSpreadsheet, Upload } from 'lucide-react';
import PageShell from '../../components/PageShell';
import TableauLecture, { type ColonneLecture } from '../../components/patrimoine/TableauLecture';
import { Badge, Card, EmptyState } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { triggerBlobDownload } from '../../lib/api';
import { importerPatrimoine, telechargerModeleImport } from '../../lib/apiImportPatrimoine';
import { useAuth } from '../../lib/auth';
import { formatNumber } from '../../lib/format';
import { CONFIG_IMPORT, RESULTAT_IMPORT, typeImportDepuis } from '../../lib/importPatrimoine';
import { useTranchesReferentiel } from '../../lib/referentiels';
import { estAdministrateur } from '../../lib/roles';
import { errorMessage } from '../../lib/useApi';
import type { BilanImportDto, LigneBilanDto } from '../../types/importPatrimoine';

const COLONNES: ColonneLecture<LigneBilanDto>[] = [
  { titre: 'Ligne', rendu: (l) => formatNumber(l.numero), droite: true },
  { titre: 'Pivot', rendu: (l) => l.pivot || '—' },
  { titre: 'Code', rendu: (l) => l.code || '—' },
  { titre: 'Résultat', rendu: (l) => <Badge tone={RESULTAT_IMPORT[l.resultat].ton}>{RESULTAT_IMPORT[l.resultat].libelle}</Badge> },
  { titre: 'Message', rendu: (l) => <span className="whitespace-normal">{l.message || '—'}</span> },
];

function Compteurs({ bilan }: Readonly<{ bilan: BilanImportDto }>) {
  const items = [
    ['Lignes lues', bilan.lignesLues],
    ['Créations', bilan.creations],
    ['Mises à jour', bilan.misesAJour],
    ['Inchangées', bilan.inchangees],
    ['Erreurs', bilan.erreurs],
  ] as const;
  return (
    <dl className="flex flex-wrap gap-x-6 gap-y-1 text-body">
      {items.map(([libelle, n]) => (
        <div key={libelle} className="flex gap-1.5">
          <dt className="text-muted-foreground">{libelle}</dt>
          <dd className="font-medium tabular-nums">{formatNumber(n)}</dd>
        </div>
      ))}
    </dl>
  );
}

function BilanCard({ bilan }: Readonly<{ bilan: BilanImportDto }>) {
  const liste = CONFIG_IMPORT[bilan.type].liste;
  const [erreursSeules, setErreursSeules] = useState(false);
  const lignes = erreursSeules ? bilan.lignes.filter((l) => l.resultat === 'ERREUR' || l.resultat === 'NON_VERIFIEE') : bilan.lignes;
  const titre = bilan.ecrit ? 'Import terminé' : 'Bilan de la vérification';
  return (
    <Card title={titre}>
      <div className="flex flex-col gap-3">
        <Compteurs bilan={bilan} />
        {bilan.ecrit && (
          <p className="text-body">
            Les données ont été écrites.{' '}
            <Link className="underline" to={liste.to}>Voir la liste</Link>
          </p>
        )}
        {bilan.avertissements.length > 0 && (
          <ul className="list-disc pl-5 text-label text-muted-foreground">
            {bilan.avertissements.map((a) => <li key={a}>{a}</li>)}
          </ul>
        )}
        <label className="flex items-center gap-2 text-label">
          <input type="checkbox" checked={erreursSeules} onChange={(e) => setErreursSeules(e.target.checked)} />
          Erreurs seules
        </label>
        {lignes.length === 0 ? (
          <EmptyState title="Aucune ligne à afficher" message="Aucune ligne ne correspond au filtre." />
        ) : (
          <TableauLecture lignes={lignes} colonnes={COLONNES} cle={(l, i) => `${l.numero}-${i}`} />
        )}
      </div>
    </Card>
  );
}

export default function ImportPatrimoine() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const type = typeImportDepuis(params.get('type'));
  const { libelle: libelleType, liste, tranche: avecTranche, suffixe, aide } = CONFIG_IMPORT[type];
  const tranches = useTranchesReferentiel();
  const [trancheId, setTrancheId] = useState<string | null>(params.get('trancheId'));
  const pret = !avecTranche || !!trancheId;
  const [fichier, setFichier] = useState<File | null>(null);
  const [bilan, setBilan] = useState<BilanImportDto | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const itemsTranches = tranches.data.map((t) => ({ label: t.description || t.code || t.id, value: t.id }));
  const importable = !!bilan && bilan.simulation && bilan.erreurs === 0 && !enCours;

  function choisir(f: File | null) {
    setFichier(f);
    setBilan(null);
    setErreur(null);
  }

  function deposer(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    choisir(e.dataTransfer.files.item(0));
  }

  async function lancer(simulation: boolean) {
    if (!pret || !fichier) return;
    setEnCours(true);
    setErreur(null);
    try {
      setBilan(await importerPatrimoine({ type, trancheId: avecTranche ? (trancheId ?? undefined) : undefined, fichier, simulation }));
    } catch (err) {
      setErreur(errorMessage(err));
    } finally {
      setEnCours(false);
    }
  }

  async function modele() {
    if (!pret) return;
    setErreur(null);
    const prefixe = avecTranche ? (tranches.data.find((t) => t.id === trancheId)?.code ?? 'tranche') : 'PATRIMOINE';
    try {
      triggerBlobDownload(await telechargerModeleImport(type, avecTranche ? (trancheId ?? undefined) : undefined), `${prefixe}_STOCK_${suffixe}.xlsx`);
    } catch (err) {
      setErreur(errorMessage(err));
    }
  }

  return (
    <PageShell
      title={`Import des ${libelleType}`}
      crumbs={[{ label: 'Patrimoine' }, { label: liste.libelle, to: liste.to }, { label: 'Import' }]}
      icon={<FileSpreadsheet />}
      accent="var(--sec-tranche)"
      accentBg="var(--sec-tranche-bg)"
    >
      {estAdministrateur(user) ? (
        <div className="flex flex-col gap-3">
          <Card title="Fichier à importer">
            <p className="mb-3 text-label text-muted-foreground">
              Téléchargez le modèle {aide}, complétez-le, puis vérifiez-le avant de l'importer.
              Une cellule vide laisse le champ inchangé.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {avecTranche && (
                <Select
                  items={itemsTranches}
                  value={trancheId}
                  onValueChange={(v) => {
                    setTrancheId(v);
                    setBilan(null);
                  }}
                >
                  <SelectTrigger size="sm" className="w-60" aria-label="Tranche">
                    <SelectValue placeholder={tranches.loading ? 'Chargement…' : 'Tranche'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {itemsTranches.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
              <Button type="button" size="sm" variant="outline" disabled={!pret} onClick={() => void modele()}>
                <Download data-icon="inline-start" /> Télécharger le modèle
              </Button>
            </div>
            <label
              onDragOver={(e) => e.preventDefault()}
              onDrop={deposer}
              className="mt-3 flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-dashed border-input px-4 py-8 text-body text-muted-foreground hover:border-ring"
            >
              <Upload className="size-5" />
              <span>Glisser le fichier .xlsx ici ou cliquer pour le choisir</span>
              <span className="text-micro">{fichier ? fichier.name : 'Aucun fichier choisi'}</span>
              <input type="file" accept=".xlsx" className="hidden" onChange={(e) => choisir(e.target.files?.[0] ?? null)} />
            </label>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button type="button" size="sm" variant="outline" disabled={!pret || !fichier || enCours} onClick={() => void lancer(true)}>
                {enCours && !importable ? 'Traitement en cours…' : 'Vérifier les données'}
              </Button>
              <Button type="button" size="sm" disabled={!importable} onClick={() => void lancer(false)}>
                Importer
              </Button>
              {!pret && <span className="text-micro text-muted-foreground">Vous devez sélectionner une tranche.</span>}
            </div>
            {erreur && <p role="alert" className="mt-3 text-body text-destructive">{erreur}</p>}
          </Card>
          {bilan && <BilanCard key={`${bilan.simulation}-${bilan.lignesLues}`} bilan={bilan} />}
        </div>
      ) : (
        <EmptyState title="Accès réservé" message="Seul un administrateur peut importer des données." />
      )}
    </PageShell>
  );
}
