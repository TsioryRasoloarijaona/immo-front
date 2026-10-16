import { useState } from 'react';
import Modal from '../../Modal';
import SearchableSelect from '../../SearchableSelect';
import { Button } from '../../ui/button';
import { DialogFooter } from '../../ui/dialog';
import { FieldGroup } from '../../ui/field';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { ETAT_MODIFICATION_LIBELLES, lireMontant, versChampDate } from '../../../lib/dossierSousListes';
import { toApiDateTime, todayISO } from '../../../lib/format';
import type { EtatModification, ModificationDto, ModificationRequest } from '../../../types/dossierSousListes';
import Champ from './Champ';

const ETATS = Object.entries(ETAT_MODIFICATION_LIBELLES).map(([value, label]) => ({ value, label }));

function texteMontant(v: number | null | undefined): string {
  return v == null ? '' : String(v);
}

/** Saisie d'une demande de modification ; une demande acceptée ou réalisée compte dans le dossier. */
export default function ModificationDialog({
  initiale,
  occupe,
  onValider,
  onFermer,
}: Readonly<{
  initiale: ModificationDto | null;
  occupe: boolean;
  onValider: (corps: ModificationRequest) => Promise<void>;
  onFermer: () => void;
}>) {
  const [description, setDescription] = useState(initiale?.description ?? '');
  const [dateDemande, setDateDemande] = useState(versChampDate(initiale?.dateDemande) || todayISO());
  const [dateTechnique, setDateTechnique] = useState(versChampDate(initiale?.dateValidationTechnique));
  const [dateClient, setDateClient] = useState(versChampDate(initiale?.dateValidationClient));
  const [cout, setCout] = useState(texteMontant(initiale?.cout));
  const [prixHT, setPrixHT] = useState(texteMontant(initiale?.prixHT));
  const [prixTTC, setPrixTTC] = useState(texteMontant(initiale?.prixTTC));
  const [etat, setEtat] = useState<string | null>(initiale?.etat ?? 'ENCOURS');
  const [notes, setNotes] = useState(initiale?.notes ?? '');

  function corps(): ModificationRequest {
    return {
      description: description || undefined,
      dateDemande: toApiDateTime(dateDemande),
      dateValidationTechnique: toApiDateTime(dateTechnique),
      dateValidationClient: toApiDateTime(dateClient),
      cout: lireMontant(cout),
      prixHT: lireMontant(prixHT),
      prixTTC: lireMontant(prixTTC),
      etat: (etat ?? undefined) as EtatModification | undefined,
      notes: notes || undefined,
    };
  }

  return (
    <Modal title={initiale ? 'Modifier la demande' : 'Nouvelle demande de modification'} onClose={onFermer} width={560}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void onValider(corps());
        }}
      >
        <FieldGroup>
          <Champ id="mod-desc" libelle="Description">
            <Input id="mod-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </Champ>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Champ id="mod-demande" libelle="Demande">
              <Input id="mod-demande" type="date" value={dateDemande} onChange={(e) => setDateDemande(e.target.value)} />
            </Champ>
            <Champ id="mod-tech" libelle="Validation technique">
              <Input id="mod-tech" type="date" value={dateTechnique} onChange={(e) => setDateTechnique(e.target.value)} />
            </Champ>
            <Champ id="mod-client" libelle="Validation client">
              <Input id="mod-client" type="date" value={dateClient} onChange={(e) => setDateClient(e.target.value)} />
            </Champ>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Champ id="mod-cout" libelle="Coût">
              <Input id="mod-cout" inputMode="decimal" value={cout} onChange={(e) => setCout(e.target.value)} />
            </Champ>
            <Champ id="mod-ht" libelle="Prix HT">
              <Input id="mod-ht" inputMode="decimal" value={prixHT} onChange={(e) => setPrixHT(e.target.value)} />
            </Champ>
            <Champ id="mod-ttc" libelle="Prix TTC">
              <Input id="mod-ttc" inputMode="decimal" value={prixTTC} onChange={(e) => setPrixTTC(e.target.value)} />
            </Champ>
          </div>
          <Champ id="mod-etat" libelle="État">
            <SearchableSelect id="mod-etat" items={ETATS} value={etat} onValueChange={setEtat} />
          </Champ>
          <Champ id="mod-notes" libelle="Notes">
            <Textarea id="mod-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Champ>
        </FieldGroup>
        <DialogFooter className="mt-5">
          <Button type="button" variant="outline" onClick={onFermer}>Annuler</Button>
          <Button type="submit" disabled={occupe}>Enregistrer</Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}
