import { useRef, useState } from 'react';
import { Database, Plus, Sparkles } from 'lucide-react';
import Modal from '../Modal';
import { ErrorState, LoadingState } from '../ui';
import { Button } from '../ui/button';
import { DialogFooter } from '../ui/dialog';
import SectionsSaisie from './SectionsSaisie';
import TableLignes from './TableLignes';
import { genererPrevisionsBase, getPrevisionsBase, getStockTranche, putPrevisionsBase } from '../../lib/apiPatrimoine';
import { COLONNES_PREVISIONS, SECTIONS_PREVISIONS, sansMontants } from '../../lib/champsPrevisionsBase';
import { formatNumber } from '../../lib/format';
import { changerRangee, somme, type Rangee } from '../../lib/ongletsTranche';
import { brouillonDepuis, champsDe, corpsDepuis, useSaisie } from '../../lib/saisiePatrimoine';
import { useToast } from '../../lib/toastContext';
import { useApi } from '../../lib/useApi';
import type { LignePrevisionDto, PrevisionsBaseDto } from '../../types';

const CHAMPS = champsDe(SECTIONS_PREVISIONS);

const versRangees = (lignes: LignePrevisionDto[]): Rangee<LignePrevisionDto>[] =>
  lignes.map((ligne, i) => ({ cle: ligne.id ?? `g${i}`, ligne }));

/** Σ d'une quantité face au nombre d'articles : le serveur refuse l'enregistrement s'ils diffèrent. */
function Total({ libelle, total, attendu }: Readonly<{ libelle: string; total: number; attendu: number }>) {
  const ecart = total !== attendu;
  return (
    <span className={ecart ? 'text-destructive' : 'text-muted-foreground'}>
      {libelle} : <span className="font-medium tabular-nums">{formatNumber(total)}</span> / {formatNumber(attendu)} articles
    </span>
  );
}

function SaisiePrevisions({ trancheId, initiales, onClose }: Readonly<{
  trancheId: string;
  initiales: PrevisionsBaseDto;
  onClose: () => void;
}>) {
  const showToast = useToast();
  const { brouillon, setBrouillon, modifier, envoi, erreur, envoyer } = useSaisie(CHAMPS, brouillonDepuis(CHAMPS, initiales));
  const [rangees, setRangees] = useState(() => versRangees(initiales.lignes));
  const [version, setVersion] = useState(0);
  const compteur = useRef(0);
  const lignes = rangees.map((r) => r.ligne);
  const attendu = Number(brouillon.nombreArticles) || 0;

  const corps = (avec: LignePrevisionDto[]) => ({ ...corpsDepuis(CHAMPS, brouillon), lignes: avec }) as PrevisionsBaseDto;

  function charger() {
    void envoyer(() => getStockTranche(trancheId), (stock) => setBrouillon((b) => ({
      ...b, nombreArticles: String(stock.nombreArticles), valorisationStock: String(stock.valorisationStock),
    })));
  }

  function generer() {
    void envoyer(() => genererPrevisionsBase(trancheId, corps([])), (resultat) => {
      setRangees(versRangees(resultat.lignes));
      setVersion((v) => v + 1);
    });
  }

  function ajouter() {
    compteur.current += 1;
    setRangees([...rangees, { cle: `n${compteur.current}`, ligne: { quantiteConcretisation: 0, quantiteFinalisation: 0 } }]);
  }

  function enregistrer() {
    void envoyer(() => putPrevisionsBase(trancheId, corps(lignes)), () => {
      showToast('Prévisions de base enregistrées.');
      onClose();
    });
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        <SectionsSaisie sections={SECTIONS_PREVISIONS} brouillon={brouillon} onChange={modifier} />
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" disabled={envoi} onClick={charger}>
            <Database data-icon="inline-start" /> Charger à partir du stock
          </Button>
          <Button type="button" size="sm" variant="outline" disabled={envoi} onClick={generer}>
            <Sparkles data-icon="inline-start" /> Générer
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={ajouter}><Plus data-icon="inline-start" /> Ajouter une ligne</Button>
        </div>
        <TableLignes colonnes={COLONNES_PREVISIONS} rangees={rangees} editable version={version}
          onChange={(cle, nom, valeur) => setRangees(changerRangee(rangees, cle, nom, valeur, sansMontants))}
          onRetirer={(cle) => setRangees(rangees.filter((r) => r.cle !== cle))} />
        <p className="flex flex-wrap gap-x-4 text-label">
          <Total libelle="Σ concrétisation" total={somme(lignes, (l) => l.quantiteConcretisation)} attendu={attendu} />
          <Total libelle="Σ finalisation" total={somme(lignes, (l) => l.quantiteFinalisation)} attendu={attendu} />
        </p>
        {erreur && <p role="alert" className="whitespace-pre-line text-micro text-destructive">{erreur}</p>}
      </div>
      <DialogFooter className="mt-4">
        <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
        <Button type="button" disabled={envoi} onClick={enregistrer}>Enregistrer</Button>
      </DialogFooter>
    </>
  );
}

/** « Prévisions de base » de la tranche (Administrateur) : en-tête, génération en cloche sans écriture, lignes, Enregistrer. */
export default function DialoguePrevisionsBase({ trancheId, onClose }: Readonly<{ trancheId: string; onClose: () => void }>) {
  const { data, error } = useApi(() => getPrevisionsBase(trancheId), [trancheId]);
  return (
    <Modal title="Prévisions de base" onClose={onClose} width={1100}>
      {error && <ErrorState message={error} />}
      {!error && !data && <LoadingState />}
      {!error && data && <SaisiePrevisions trancheId={trancheId} initiales={data} onClose={onClose} />}
    </Modal>
  );
}
