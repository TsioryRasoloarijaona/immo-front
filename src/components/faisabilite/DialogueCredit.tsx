import { useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import Modal from '../Modal';
import SectionsSaisie from '../patrimoine/SectionsSaisie';
import TableLignes from '../patrimoine/TableLignes';
import { Button } from '../ui/button';
import { DialogFooter } from '../ui/dialog';
import { genererEcheancier } from '../../lib/apiFaisabilite';
import { todayISO } from '../../lib/format';
import { remboursementApres, SECTIONS_CREDIT } from '../../lib/financeFaisabilite';
import { changerRangee, type ColonneOnglet, type Rangee } from '../../lib/ongletsTranche';
import { brouillonDepuis, champsDe, corpsDepuis, useSaisie } from '../../lib/saisiePatrimoine';
import type { EcheancierDemandeDto, FinancementFaisabiliteDto, RemboursementFaisabiliteDto } from '../../types/faisabilite';

const CHAMPS = champsDe(SECTIONS_CREDIT);

const COLONNES: ColonneOnglet<RemboursementFaisabiliteDto>[] = [
  { nom: 'date', libelle: 'Date', type: 'date' },
  { nom: 'montantBase', libelle: 'Principal', type: 'montant' },
  { nom: 'tauxInteret', libelle: "Taux d'intérêt", type: 'pourcent' },
  { nom: 'montantInterets', libelle: 'Intérêts', type: 'montant' },
  { nom: 'montantARegler', libelle: 'À régler', type: 'montant', calcule: () => true },
];

const nombre = (v: unknown) => (typeof v === 'number' ? v : null);
const texteOuNull = (v: unknown) => (typeof v === 'string' ? v : null);

function demandeDepuis(corps: Record<string, unknown>): EcheancierDemandeDto {
  return {
    dateDeblocage: texteOuNull(corps.dateDeblocage),
    montant: nombre(corps.montant),
    nombreRemboursements: nombre(corps.nombreRemboursements),
    periodiciteMois: nombre(corps.periodiciteMois),
    periodeGraceMois: nombre(corps.periodeGraceMois),
    tauxCharge: nombre(corps.tauxCharge),
  };
}

/** Crédit et sa grille de remboursements ; « Générer » demande l'échéancier au serveur sans rien écrire. */
export default function DialogueCredit({ etudeId, credit, lecture, onValider, onClose }: Readonly<{
  etudeId: string;
  credit: FinancementFaisabiliteDto | null;
  lecture: boolean;
  onValider: (credit: FinancementFaisabiliteDto) => Promise<void>;
  onClose: () => void;
}>) {
  const saisie = useSaisie(CHAMPS, brouillonDepuis(CHAMPS, credit ?? { periodiciteMois: 1, dateDeblocage: todayISO() }));
  const [rangees, setRangees] = useState<Rangee<RemboursementFaisabiliteDto>[]>(
    () => (credit?.remboursements ?? []).map((ligne, i) => ({ cle: ligne.id ?? `l${i}`, ligne })),
  );
  const [version, setVersion] = useState(0);
  const compteur = useRef(0);
  const corps = corpsDepuis(CHAMPS, saisie.brouillon);

  function generer() {
    void saisie.envoyer(() => genererEcheancier(etudeId, demandeDepuis(corps)), (lignes) => {
      setRangees(lignes.map((ligne, i) => ({ cle: `g${i}`, ligne })));
      setVersion((v) => v + 1);
    });
  }

  function ajouter() {
    compteur.current += 1;
    setRangees([...rangees, { cle: `n${compteur.current}`, ligne: { date: null, montantBase: null } }]);
  }

  function valider() {
    const dto: FinancementFaisabiliteDto = {
      id: credit?.id,
      description: texteOuNull(corps.description) ?? '',
      ...demandeDepuis(corps),
      remboursements: rangees.map((r) => r.ligne),
    };
    void saisie.envoyer(() => onValider(dto), onClose);
  }

  return (
    <Modal title={credit ? 'Crédit' : 'Nouveau crédit'} onClose={onClose} width={900}>
      <div className="flex flex-col gap-3">
        <SectionsSaisie sections={SECTIONS_CREDIT} brouillon={saisie.brouillon} onChange={saisie.modifier}
          champErreur={saisie.champErreur} messageErreur={saisie.erreur} verrouilles={lecture ? CHAMPS.map((c) => c.nom) : []} />
        {!lecture && (
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" variant="outline" disabled={saisie.envoi} onClick={generer}>Générer l'échéancier</Button>
            <Button type="button" size="sm" variant="outline" onClick={ajouter}><Plus data-icon="inline-start" /> Ajouter un remboursement</Button>
            <span className="text-micro text-muted-foreground">Générer remplace tous les remboursements de la grille.</span>
          </div>
        )}
        <TableLignes colonnes={COLONNES} rangees={rangees} editable={!lecture} version={version}
          onChange={(cle, nom, valeur) => setRangees(changerRangee(rangees, cle, nom, valeur, (l) => remboursementApres(l, nom)))}
          onRetirer={(cle) => setRangees(rangees.filter((r) => r.cle !== cle))} />
        {saisie.erreur && !saisie.champErreur && <p role="alert" className="text-body text-destructive">{saisie.erreur}</p>}
      </div>
      <DialogFooter className="mt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={saisie.envoi}>{lecture ? 'Fermer' : 'Annuler'}</Button>
        {!lecture && <Button type="button" disabled={saisie.envoi} onClick={valider}>Enregistrer le crédit</Button>}
      </DialogFooter>
    </Modal>
  );
}
