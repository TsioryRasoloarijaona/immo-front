import { useState } from 'react';
import { CalendarRange } from 'lucide-react';
import Modal from '../../Modal';
import SearchableSelect from '../../SearchableSelect';
import { Button } from '../../ui/button';
import { DialogFooter } from '../../ui/dialog';
import { FieldGroup } from '../../ui/field';
import { Input } from '../../ui/input';
import { genererEcheancesPeriodiques } from '../../../lib/apiDossierSousListes';
import { PERIODICITE_LIBELLES, lireMontant } from '../../../lib/dossierSousListes';
import { formatCurrency, toApiDateTime, todayISO } from '../../../lib/format';
import { referentielItems, useCategoriesEcheance } from '../../../lib/referentiels';
import { useEcriture } from '../../../lib/useEcriture';
import type { Periodicite } from '../../../types/dossierSousListes';
import Champ from './Champ';

const PERIODICITES = Object.entries(PERIODICITE_LIBELLES).map(([value, label]) => ({ value, label }));

/** « Générer périodicité » : découpe un montant en N échéances ; le serveur borne le montant au restant. */
export default function GenererPeriodicite({
  dossierId,
  montantInitial,
  onGenere,
}: Readonly<{ dossierId: string; montantInitial: number | null | undefined; onGenere: () => Promise<void> }>) {
  const [ouvert, setOuvert] = useState(false);
  const [categorieId, setCategorieId] = useState<string | null>(null);
  const [montant, setMontant] = useState('');
  const [nombre, setNombre] = useState('12');
  const [periodicite, setPeriodicite] = useState<string | null>('MENSUELLE');
  const [premiereDate, setPremiereDate] = useState(todayISO());
  const [notes, setNotes] = useState('');
  const categories = referentielItems(useCategoriesEcheance().data);
  const { occupe, executer } = useEcriture();

  function ouvrir() {
    setMontant(montantInitial ? String(montantInitial) : '');
    setOuvert(true);
  }

  const montantLu = lireMontant(montant);
  const nombreLu = Number(nombre);
  const complet = !!categorieId && !!periodicite && !!premiereDate && !!montantLu && nombreLu >= 1;

  async function valider() {
    if (!categorieId || !periodicite || !montantLu || !premiereDate || nombreLu < 1) return;
    const corps = {
      categorieId,
      montantTotal: montantLu,
      nombre: nombreLu,
      periodicite: periodicite as Periodicite,
      premiereDate: toApiDateTime(premiereDate) ?? premiereDate,
      notes: notes || undefined,
    };
    const ok = await executer(async () => {
      await genererEcheancesPeriodiques(dossierId, corps);
      await onGenere();
    }, `${nombreLu} échéance(s) générée(s).`);
    if (ok) setOuvert(false);
  }

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={ouvrir}>
        <CalendarRange data-icon="inline-start" /> Générer périodicité
      </Button>
      {ouvert && (
        <Modal title="Générer une périodicité" onClose={() => setOuvert(false)} width={480}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void valider();
            }}
          >
            <FieldGroup>
              <Champ id="per-cat" libelle="Catégorie *">
                <SearchableSelect id="per-cat" items={categories} value={categorieId} onValueChange={setCategorieId} placeholder="Choisir…" />
              </Champ>
              <Champ id="per-montant" libelle="Montant à défalquer *">
                <Input id="per-montant" inputMode="decimal" value={montant} onChange={(e) => setMontant(e.target.value)} />
                {montantInitial != null && (
                  <span className="text-micro text-muted-foreground">Au plus {formatCurrency(montantInitial)}</span>
                )}
              </Champ>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Champ id="per-nombre" libelle="Nombre d'échéances *">
                  <Input id="per-nombre" type="number" min={1} value={nombre} onChange={(e) => setNombre(e.target.value)} />
                </Champ>
                <Champ id="per-periode" libelle="Périodicité *">
                  <SearchableSelect id="per-periode" items={PERIODICITES} value={periodicite} onValueChange={setPeriodicite} />
                </Champ>
              </div>
              <Champ id="per-date" libelle="Première échéance *">
                <Input id="per-date" type="date" value={premiereDate} onChange={(e) => setPremiereDate(e.target.value)} />
              </Champ>
              <Champ id="per-notes" libelle="Note">
                <Input id="per-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </Champ>
            </FieldGroup>
            <DialogFooter className="mt-5">
              <Button type="button" variant="outline" onClick={() => setOuvert(false)}>Annuler</Button>
              <Button type="submit" disabled={occupe || !complet}>Générer</Button>
            </DialogFooter>
          </form>
        </Modal>
      )}
    </>
  );
}
