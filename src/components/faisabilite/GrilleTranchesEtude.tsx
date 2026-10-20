import { useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { Card } from '../ui';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import SaisieOnglet from '../patrimoine/SaisieOnglet';
import TableLignes from '../patrimoine/TableLignes';
import { listTranchesEtude, remplacerTranchesEtude } from '../../lib/apiFaisabilite';
import { useAuth } from '../../lib/auth';
import { MESSAGE_BLOQUEE, choixAvec, trancheNeuve } from '../../lib/faisabilite';
import { afficherValeur, changerRangee, type ColonneOnglet, type Rangee, type Valeur } from '../../lib/ongletsTranche';
import { estAdministrateur } from '../../lib/roles';
import { useToast } from '../../lib/toastContext';
import { errorMessage, useApi } from '../../lib/useApi';
import type { EtudeFaisabiliteDto, LigneTrancheEtudeDto, VentilationEtudeDto } from '../../types/faisabilite';

type ChampVentilation = 'quantite' | 'poids';

const COLONNES_VENTILATION: (ColonneOnglet<VentilationEtudeDto> & { nom: ChampVentilation })[] = [
  { nom: 'quantite', libelle: 'Quantité', type: 'nombre' },
  { nom: 'poids', libelle: 'Poids', type: 'pourcent' },
];

const dateTranche = (nom: keyof LigneTrancheEtudeDto, libelle: string): ColonneOnglet<LigneTrancheEtudeDto> =>
  ({ nom, libelle, type: 'date' });

/** Ventilation de chaque unité de l'étude sur chaque tranche : une ligne par couple (tranche, unité). */
function VentilationTranches({ fiche, rangees, editable, version, onChange }: Readonly<{
  fiche: EtudeFaisabiliteDto;
  rangees: Rangee<LigneTrancheEtudeDto>[];
  editable: boolean;
  version: number;
  onChange: (cle: string, uniteEtudeId: string, nom: 'quantite' | 'poids', valeur: Valeur) => void;
}>) {
  return (
    <Card title="Ventilation des unités par tranche" padded={false}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tranche</TableHead>
            <TableHead>Unité de base</TableHead>
            {COLONNES_VENTILATION.map((c) => <TableHead key={c.nom}>{c.libelle}</TableHead>)}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rangees.flatMap((r) => fiche.unites.map((u) => {
            const ventilation = r.ligne.unites.find((v) => v.uniteEtudeId === u.id)
              ?? { uniteEtudeId: u.id ?? '', quantite: null, poids: null };
            return (
              <TableRow key={`${r.cle}-${u.id}-${version}`}>
                <TableCell>{r.ligne.code}</TableCell>
                <TableCell>{u.uniteCode || u.uniteLibelle}</TableCell>
                {COLONNES_VENTILATION.map((c) => (
                  <TableCell key={c.nom}>
                    {editable
                      ? <SaisieOnglet colonne={c} ligne={ventilation} onChange={(v) => onChange(r.cle, ventilation.uniteEtudeId, c.nom, v)} />
                      : afficherValeur(c, ventilation)}
                  </TableCell>
                ))}
              </TableRow>
            );
          }))}
        </TableBody>
      </Table>
    </Card>
  );
}

/** Remplace (ou crée) la ventilation d'une unité ; une ventilation vide disparaît de la liste. */
function avecVentilation(ligne: LigneTrancheEtudeDto, uniteEtudeId: string, nom: 'quantite' | 'poids', valeur: Valeur): LigneTrancheEtudeDto {
  const courante = ligne.unites.find((v) => v.uniteEtudeId === uniteEtudeId) ?? { uniteEtudeId, quantite: null, poids: null };
  const maj = { ...courante, [nom]: typeof valeur === 'number' ? valeur : null };
  const autres = ligne.unites.filter((v) => v.uniteEtudeId !== uniteEtudeId);
  return { ...ligne, unites: maj.quantite === null && maj.poids === null ? autres : [...autres, maj] };
}

/** Tranches de l'étude et ventilation des unités : PUT de la liste complète, Verif du serveur affichée telle quelle. */
export default function GrilleTranchesEtude({ fiche, onEnregistre }: Readonly<{ fiche: EtudeFaisabiliteDto; onEnregistre: () => Promise<void> }>) {
  const { user } = useAuth();
  const editable = estAdministrateur(user) && !fiche.bloquee;
  const showToast = useToast();
  const choixTranches = useApi(() => (fiche.societeId ? listTranchesEtude(fiche.societeId) : Promise.resolve([])), [fiche.societeId]);
  const [brouillon, setBrouillon] = useState<Rangee<LigneTrancheEtudeDto>[] | null>(null);
  const [version, setVersion] = useState(0);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const compteur = useRef(0);
  const rangees = brouillon ?? fiche.tranches.map((ligne, i) => ({ cle: ligne.id ?? `l${i}`, ligne }));
  const liste = choixTranches.data ?? [];

  const colonnes: ColonneOnglet<LigneTrancheEtudeDto>[] = [
    { nom: 'code', libelle: 'Code', type: 'texte' },
    { nom: 'sorting', libelle: 'Ordre', type: 'entier' },
    {
      nom: 'trancheId', libelle: 'Tranche du patrimoine', type: 'choix', facultatif: true,
      choix: (l) => choixAvec(liste, l.trancheId, { description: l.trancheLibelle ?? undefined }),
    },
    { nom: 'poids', libelle: 'Poids', type: 'pourcent' },
    dateTranche('debutTravaux', 'Début des travaux'),
    dateTranche('finTravaux', 'Fin des travaux'),
    dateTranche('debutCommercialisation', 'Début de commercialisation'),
    dateTranche('finCommercialisation', 'Fin de commercialisation'),
    dateTranche('finConcretisation', 'Fin de concrétisation'),
    dateTranche('debutFinalisation', 'Début de finalisation'),
    dateTranche('dateLivraison', 'Livraison'),
    dateTranche('datePermisHabiter', "Permis d'habiter"),
  ];

  function ajouter() {
    compteur.current += 1;
    setBrouillon([...rangees, { cle: `n${compteur.current}`, ligne: trancheNeuve(fiche, rangees.length + 1, rangees.map((r) => r.ligne.code)) }]);
  }

  async function enregistrer() {
    setEnvoi(true);
    setErreur(null);
    try {
      await remplacerTranchesEtude(fiche.id, rangees.map((r) => r.ligne));
      await onEnregistre();
      setBrouillon(null);
      setVersion((v) => v + 1);
      showToast('Tranches enregistrées.');
    } catch (err) {
      setErreur(errorMessage(err));
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {fiche.bloquee && <p className="text-micro text-muted-foreground">{MESSAGE_BLOQUEE}</p>}
      <TableLignes colonnes={colonnes} rangees={rangees} editable={editable} version={version}
        onChange={(cle, nom, valeur) => setBrouillon(changerRangee(rangees, cle, nom, valeur))}
        onRetirer={(cle) => setBrouillon(rangees.filter((r) => r.cle !== cle))} />
      {rangees.length > 0 && fiche.unites.length > 0 && (
        <VentilationTranches fiche={fiche} rangees={rangees} editable={editable} version={version}
          onChange={(cle, uniteEtudeId, nom, valeur) => setBrouillon(rangees.map((r) => (r.cle === cle
            ? { cle, ligne: avecVentilation(r.ligne, uniteEtudeId, nom, valeur) }
            : r)))} />
      )}
      {editable && (
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={ajouter}><Plus data-icon="inline-start" /> Ajouter une tranche</Button>
          <Button type="button" size="sm" disabled={envoi || !brouillon} onClick={() => void enregistrer()}>Enregistrer</Button>
          {brouillon && (
            <Button type="button" size="sm" variant="ghost" onClick={() => { setBrouillon(null); setVersion((v) => v + 1); }}>Annuler</Button>
          )}
        </div>
      )}
      {erreur && <p role="alert" className="text-micro text-destructive">{erreur}</p>}
    </div>
  );
}
