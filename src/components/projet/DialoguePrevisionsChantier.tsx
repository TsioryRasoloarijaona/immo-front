import { useRef, useState } from 'react';
import { Copy, Plus, Save } from 'lucide-react';
import BarreIcones from '../BarreIcones';
import Modal from '../Modal';
import TableLignes from '../patrimoine/TableLignes';
import { ErrorState, LoadingState } from '../ui';
import { Button } from '../ui/button';
import { DialogFooter } from '../ui/dialog';
import { getPrevisionsChantier, putPrevisionsChantier } from '../../lib/apiProjet';
import { changerRangee, type ColonneOnglet, type Rangee, type Valeur } from '../../lib/ongletsTranche';
import { useSaisie } from '../../lib/saisiePatrimoine';
import { useToast } from '../../lib/toastContext';
import { useApi } from '../../lib/useApi';
import type { UUID } from '../../types';
import type { LignePrevisionChantierDto, PrevisionsChantierDto, TypeTravauxDto } from '../../types/projet';

/** Ligne en saisie : sans `id` tant qu'elle n'est pas enregistrée ; totaux nuls dès qu'une valeur change (calculés par le serveur). */
type LigneSaisie = Omit<LignePrevisionChantierDto, 'id' | 'totalHT' | 'totalTTC'> & {
  id?: UUID;
  totalHT: number | null;
  totalTTC: number | null;
};

const versRangees = (lignes: LignePrevisionChantierDto[]): Rangee<LigneSaisie>[] =>
  lignes.map((ligne) => ({ cle: ligne.id, ligne }));

const depuisType = (t: TypeTravauxDto, ligne?: LigneSaisie): LigneSaisie => ({
  typeTravauxId: t.id, code: t.code, description: t.description, unite: t.unite,
  quantite: ligne?.quantite ?? null, prixUnitaireHT: ligne?.prixUnitaireHT ?? t.prixUnitaireHT, tva: ligne?.tva ?? t.tva,
  notes: ligne?.notes ?? null, totalHT: null, totalTTC: null, id: ligne?.id,
});

const LIGNE_VIDE: LigneSaisie = {
  typeTravauxId: null, code: null, description: null, unite: null, quantite: null, prixUnitaireHT: null, tva: null,
  notes: null, totalHT: null, totalTTC: null,
};

function colonnes(types: TypeTravauxDto[], utilises: Set<string>): ColonneOnglet<LigneSaisie>[] {
  const calcule = () => true;
  return [
    {
      nom: 'typeTravauxId', libelle: 'Type de travaux', type: 'choix',
      choix: (l) => types.filter((t) => t.id === l.typeTravauxId || !utilises.has(t.id))
        .map((t) => ({ id: t.id, code: t.code ?? undefined, description: t.description ?? undefined })),
    },
    { nom: 'unite', libelle: 'Unité', type: 'texte', calcule },
    { nom: 'quantite', libelle: 'Quantité', type: 'nombre' },
    { nom: 'prixUnitaireHT', libelle: 'PU HT', type: 'montant' },
    { nom: 'totalHT', libelle: 'Total HT', type: 'montant', calcule },
    { nom: 'tva', libelle: 'TVA %', type: 'nombre' },
    { nom: 'totalTTC', libelle: 'Total TTC', type: 'montant', calcule },
    { nom: 'notes', libelle: 'Notes', type: 'texte' },
  ];
}

function messageLecture(d: PrevisionsChantierDto): string | null {
  if (!d.actif) return "Le projet n'a pas de nivellement : les prévisions chantier ne sont pas modifiables.";
  return d.modifiable ? null : 'Lecture seule : vous n’avez pas le droit de modifier ces prévisions.';
}

function GrillePrevisions({ projetId, initiales }: Readonly<{ projetId: UUID; initiales: PrevisionsChantierDto }>) {
  const showToast = useToast();
  const { envoi, erreur, envoyer } = useSaisie([], {});
  const [donnees, setDonnees] = useState(initiales);
  const [rangees, setRangees] = useState(() => versRangees(initiales.lignes));
  const [version, setVersion] = useState(0);
  const compteur = useRef(0);
  const utilises = new Set(rangees.flatMap((r) => (r.ligne.typeTravauxId ? [r.ligne.typeTravauxId] : [])));
  const absents = donnees.typesTravaux.filter((t) => !utilises.has(t.id));
  const sansType = rangees.some((r) => !r.ligne.typeTravauxId);
  const lecture = messageLecture(donnees);

  const nouvelle = (ligne: LigneSaisie): Rangee<LigneSaisie> => {
    compteur.current += 1;
    return { cle: `n${compteur.current}`, ligne };
  };

  function changer(cle: string, nom: keyof LigneSaisie, valeur: Valeur) {
    const type = nom === 'typeTravauxId' ? donnees.typesTravaux.find((t) => t.id === valeur) : undefined;
    setRangees(changerRangee(rangees, cle, nom, valeur, (l) => {
      if (type) return depuisType(type, l);
      return nom === 'notes' ? l : { ...l, totalHT: null, totalTTC: null };
    }));
    // Les saisies de nombre ne sont pas contrôlées : les remonter pour afficher le PU et la TVA du type choisi.
    if (type) setVersion((v) => v + 1);
  }

  function enregistrer() {
    const lignes = rangees.flatMap(({ ligne: l }) => (l.typeTravauxId
      ? [{ typeTravauxId: l.typeTravauxId, quantite: l.quantite, prixUnitaireHT: l.prixUnitaireHT, tva: l.tva, notes: l.notes || null }]
      : []));
    void envoyer(() => putPrevisionsChantier(projetId, { lignes }), (resultat) => {
      setDonnees(resultat);
      setRangees(versRangees(resultat.lignes));
      setVersion((v) => v + 1);
      showToast('Prévisions chantier enregistrées.');
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-body">
        <dt className="text-muted-foreground">Code</dt><dd>{donnees.code ?? '—'}</dd>
        <dt className="text-muted-foreground">Description</dt><dd>{donnees.description ?? '—'}</dd>
      </dl>
      {lecture && <p className="text-body text-muted-foreground">{lecture}</p>}
      {!lecture && (
        <BarreIcones className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="sm" onClick={() => setRangees([...rangees, nouvelle(LIGNE_VIDE)])}>
            <Plus /> Ajouter une ligne
          </Button>
          <Button type="button" variant="ghost" size="sm" disabled={absents.length === 0}
            onClick={() => setRangees([...rangees, ...absents.map((t) => nouvelle(depuisType(t)))])}>
            <Copy /> Copier les types de travaux absents
          </Button>
          <Button type="button" variant="ghost" size="sm" disabled={envoi || sansType} onClick={enregistrer}>
            <Save /> {sansType ? 'Enregistrer (choisissez le type de chaque ligne)' : 'Enregistrer'}
          </Button>
        </BarreIcones>
      )}
      <TableLignes colonnes={colonnes(donnees.typesTravaux, utilises)} rangees={rangees} editable={!lecture} version={version}
        onChange={changer} onRetirer={(cle) => setRangees(rangees.filter((r) => r.cle !== cle))} />
      {!lecture && <p className="text-micro text-muted-foreground">Les totaux sont recalculés par le serveur à l’enregistrement.</p>}
      {erreur && <p role="alert" className="whitespace-pre-line text-body text-destructive">{erreur}</p>}
    </div>
  );
}

/** Grille « Prévisions chantier » (main-d'œuvre par type de travaux) de la fiche projet de configuration. */
export default function DialoguePrevisionsChantier({ projetId, onClose }: Readonly<{ projetId: UUID; onClose: () => void }>) {
  const { data, error } = useApi(() => getPrevisionsChantier(projetId), [projetId]);
  return (
    <Modal title="Prévisions chantier" onClose={onClose} width={1100}>
      {error && <ErrorState message={error} />}
      {!error && !data && <LoadingState />}
      {!error && data && <GrillePrevisions projetId={projetId} initiales={data} />}
      <DialogFooter className="mt-4">
        <Button type="button" variant="outline" onClick={onClose}>Fermer</Button>
      </DialogFooter>
    </Modal>
  );
}
