import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Lock, Pencil, Plus, Trash2 } from 'lucide-react';
import FicheSections from '../patrimoine/FicheSections';
import { EmptyState, ErrorState, LoadingState } from '../ui';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import DialogueAjoutCategories from './DialogueAjoutCategories';
import DialogueLignePrevision from './DialogueLignePrevision';
import {
  calculerPrevisionsEtude, getPrevisionsEtude, remplacerPrevisionsEtude,
} from '../../lib/apiFaisabilite';
import { useAuth } from '../../lib/auth';
import { MESSAGE_BLOQUEE, SECTIONS_BILAN } from '../../lib/faisabilite';
import { codesTranches, lignesVisibles, saisiesDepuis } from '../../lib/financeFaisabilite';
import { formatCurrency, formatNumber, formatPercent } from '../../lib/format';
import { estAdministrateur } from '../../lib/roles';
import { useToast } from '../../lib/toastContext';
import { errorMessage, useApi } from '../../lib/useApi';
import type {
  BilanFaisabilitePrevisionsDto, EtudeFaisabiliteDto, LignePrevisionDto, SaisiePrevisionDto,
} from '../../types/faisabilite';

function baseDe(l: LignePrevisionDto): string {
  if (l.uniteCode) return l.uniteCode;
  return l.categorieReferenceLibelle ? `% de ${l.categorieReferenceLibelle}` : '—';
}

const ratioDe = (l: LignePrevisionDto) => {
  if (l.ratio === null) return '—';
  return l.categorieReferenceId ? formatPercent(l.ratio, 2) : formatNumber(l.ratio, 2);
};

function LigneArbre({ l, aEnfants, replie, modifiable, retirable, onBasculer, onEditer, onRetirer }: Readonly<{
  l: LignePrevisionDto;
  aEnfants: boolean;
  replie: boolean;
  modifiable: boolean;
  retirable: boolean;
  onBasculer: () => void;
  onEditer: () => void;
  onRetirer: () => void;
}>) {
  return (
    <TableRow className={l.estRecette ? 'text-emerald-700' : undefined}>
      <TableCell>
        <div className="flex items-center gap-1" style={{ paddingLeft: l.profondeur * 16 }}>
          {aEnfants
            ? (
              <Button type="button" variant="ghost" size="icon-sm" aria-expanded={!replie} aria-label={`${replie ? 'Déplier' : 'Replier'} ${l.libelle ?? ''}`} onClick={onBasculer}>
                {replie ? <ChevronRight /> : <ChevronDown />}
              </Button>
            )
            : <span className="inline-block size-6" />}
          <span>{l.libelle}</span>
          {l.verrouillee && <Lock className="size-3 text-muted-foreground" aria-label="Montant imposé par l'étude" />}
        </div>
      </TableCell>
      <TableCell>{baseDe(l)}</TableCell>
      <TableCell>{ratioDe(l)}</TableCell>
      <TableCell>{formatPercent(l.tauxTva, 2)}</TableCell>
      <TableCell>{formatCurrency(l.montantHt)}</TableCell>
      <TableCell>{formatCurrency(l.montant)}</TableCell>
      <TableCell>{formatPercent(l.poids, 2)}</TableCell>
      {l.ventilation.map((v) => (
        <TableCell key={v.trancheEtudeId}>{formatCurrency(v.montantHt)} / {formatCurrency(v.montant)}</TableCell>
      ))}
      <TableCell>
        {modifiable && !l.verrouillee && (
          <div className="flex gap-1">
            <Button type="button" variant="ghost" size="icon-sm" aria-label={`Éditer ${l.libelle ?? ''}`} onClick={onEditer}><Pencil /></Button>
            {retirable && <Button type="button" variant="ghost" size="icon-sm" aria-label={`Retirer ${l.libelle ?? ''}`} onClick={onRetirer}><Trash2 /></Button>}
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}

/** Bilan = prévisions de l'étude : montants, totaux et marges calculés par le serveur ; la saisie passe par l'aperçu `/calcul`. */
export default function ArbreBilan({ fiche, onEnregistre }: Readonly<{ fiche: EtudeFaisabiliteDto; onEnregistre: () => void }>) {
  const { user } = useAuth();
  const modifiable = estAdministrateur(user) && !fiche.bloquee;
  const showToast = useToast();
  const [version, setVersion] = useState(0);
  const etat = useApi(() => getPrevisionsEtude(fiche.id), [fiche.id, version]);
  const [brouillon, setBrouillon] = useState<SaisiePrevisionDto[] | null>(null);
  const [apercu, setApercu] = useState<BilanFaisabilitePrevisionsDto | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [repliees, setRepliees] = useState<ReadonlySet<string>>(new Set());
  const [principales, setPrincipales] = useState(false);
  const [ajout, setAjout] = useState(false);
  const [edition, setEdition] = useState<string | null>(null);

  const vue = brouillon ? apercu ?? etat.data : etat.data;
  const saisies = useMemo(() => brouillon ?? saisiesDepuis(etat.data?.lignes ?? []), [brouillon, etat.data]);
  const parents = useMemo(() => new Set((vue?.lignes ?? []).map((l) => l.parentId)), [vue]);

  async function appliquer(suite: SaisiePrevisionDto[]) {
    setBrouillon(suite);
    try {
      setApercu(await calculerPrevisionsEtude(fiche.id, suite));
      setErreur(null);
    } catch (err) {
      setErreur(errorMessage(err));
    }
  }

  async function enregistrer() {
    if (!brouillon) return;
    setEnvoi(true);
    try {
      await remplacerPrevisionsEtude(fiche.id, brouillon);
      setBrouillon(null);
      setApercu(null);
      setErreur(null);
      setVersion((v) => v + 1);
      showToast('Bilan enregistré.');
      onEnregistre();
    } catch (err) {
      setErreur(errorMessage(err));
    } finally {
      setEnvoi(false);
    }
  }

  function annuler() {
    setBrouillon(null);
    setApercu(null);
    setErreur(null);
  }

  function basculer(id: string) {
    const suite = new Set(repliees);
    if (!suite.delete(id)) suite.add(id);
    setRepliees(suite);
  }

  if (etat.error) return <ErrorState message={etat.error} />;
  if (!vue) return <LoadingState />;

  const lignes = vue.lignes;
  const tranches = codesTranches(lignes);
  const enEdition = lignes.find((l) => l.categorieId === edition);
  const dejaPresentes = new Set(lignes.map((l) => l.categorieId));

  return (
    <div className="flex flex-col gap-3">
      {fiche.bloquee && <p className="text-micro text-muted-foreground">{MESSAGE_BLOQUEE}</p>}
      {vue.totaux.terrainNonInclus && (
        <p role="status" className="rounded-md border border-border bg-muted/40 px-3 py-2 text-body text-foreground">
          Terrain non inclus : les relations de trésorerie ne sont pas configurées, le coût global ne contient pas le terrain.
        </p>
      )}
      <FicheSections sections={SECTIONS_BILAN} source={vue.bilan} />
      <div className="flex flex-wrap gap-2">
        {modifiable && <Button type="button" size="sm" variant="outline" onClick={() => setAjout(true)}><Plus data-icon="inline-start" /> Ajouter des catégories</Button>}
        <Button type="button" size="sm" variant="outline" onClick={() => setPrincipales(!principales)}>
          {principales ? 'Toutes les catégories' : 'Catégories principales seulement'}
        </Button>
        {brouillon && (
          <>
            <Button type="button" size="sm" disabled={envoi || erreur !== null} onClick={() => void enregistrer()}>Enregistrer</Button>
            <Button type="button" size="sm" variant="ghost" disabled={envoi} onClick={annuler}>Annuler</Button>
          </>
        )}
      </div>
      {erreur && <p role="alert" className="text-body text-destructive">{erreur}</p>}
      {lignes.length === 0
        ? <EmptyState title="Aucune prévision" message="Ajoutez des catégories pour construire le bilan de l'étude." />
        : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Catégorie</TableHead>
                <TableHead>Base</TableHead>
                <TableHead>Ratio</TableHead>
                <TableHead>TVA</TableHead>
                <TableHead>Total HT</TableHead>
                <TableHead>Total TTC</TableHead>
                <TableHead>Poids</TableHead>
                {tranches.map((code) => <TableHead key={code}>{code} (HT / TTC)</TableHead>)}
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lignesVisibles(lignes, repliees, principales).map((l) => (
                <LigneArbre key={l.categorieId} l={l} aEnfants={parents.has(l.categorieId)} replie={repliees.has(l.categorieId)}
                  modifiable={modifiable} retirable={saisies.some((s) => s.categorieId === l.categorieId)}
                  onBasculer={() => basculer(l.categorieId)} onEditer={() => setEdition(l.categorieId)}
                  onRetirer={() => void appliquer(saisies.filter((s) => s.categorieId !== l.categorieId))} />
              ))}
            </TableBody>
          </Table>
        )}
      {ajout && (
        <DialogueAjoutCategories dejaPresentes={dejaPresentes} onClose={() => setAjout(false)}
          onValider={(ids) => { setAjout(false); void appliquer([...saisies, ...ids.map((categorieId) => ({ categorieId }))]); }} />
      )}
      {enEdition && (
        <DialogueLignePrevision etudeId={fiche.id} fiche={fiche} libelle={enEdition.libelle ?? ''}
          saisie={saisies.find((s) => s.categorieId === enEdition.categorieId) ?? { categorieId: enEdition.categorieId }}
          autres={saisies.filter((s) => s.categorieId !== enEdition.categorieId)} references={lignes}
          onClose={() => setEdition(null)}
          onValider={(saisie) => {
            setEdition(null);
            void appliquer([...saisies.filter((s) => s.categorieId !== saisie.categorieId), saisie]);
          }} />
      )}
    </div>
  );
}
