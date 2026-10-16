import { useState } from 'react';
import Modal from '../../Modal';
import SearchableSelect from '../../SearchableSelect';
import { Button } from '../../ui/button';
import { DialogFooter } from '../../ui/dialog';
import { FieldGroup } from '../../ui/field';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { getCatalogueCadeaux, getRaisonsCadeaux } from '../../../lib/apiDossierSousListes';
import { lireMontant, versChampDate } from '../../../lib/dossierSousListes';
import { formatCurrency, toApiDateTime } from '../../../lib/format';
import { useApi } from '../../../lib/useApi';
import type { CadeauCatalogueDto, CadeauDto, CadeauRequest } from '../../../types/dossierSousListes';
import Champ from './Champ';

function optionsCatalogue(liste: CadeauCatalogueDto[] | null): { value: string; label: string }[] {
  return (liste ?? []).map((c) => {
    const stock = c.enStock == null ? '' : ` · ${c.enStock} en stock`;
    const prix = c.prix == null ? '' : ` · ${formatCurrency(c.prix)}`;
    return { value: c.id, label: `${c.libelle || c.code || '—'}${prix}${stock}` };
  });
}

/** Saisie d'un cadeau ; livré impose une date de livraison (le serveur renvoie 400 sinon). */
export default function CadeauDialog({
  dossierId,
  initial,
  raisonModifiable,
  occupe,
  onValider,
  onFermer,
}: Readonly<{
  dossierId: string;
  initial: CadeauDto | null;
  /** Changer la raison exige Administrateur ou Commercial Chef. */
  raisonModifiable: boolean;
  occupe: boolean;
  onValider: (corps: CadeauRequest) => Promise<void>;
  onFermer: () => void;
}>) {
  const catalogue = useApi(() => getCatalogueCadeaux(dossierId), [dossierId], 'cadeaux-catalogue');
  const raisons = useApi(() => getRaisonsCadeaux(dossierId), [dossierId], 'cadeaux-raisons');
  const [cadeauId, setCadeauId] = useState<string | null>(initial?.cadeauId ?? null);
  const [prix, setPrix] = useState(initial?.prix == null ? '' : String(initial.prix));
  const [raisonId, setRaisonId] = useState<string | null>(initial?.raisonId ?? null);
  const [livre, setLivre] = useState(initial?.livre ?? false);
  const [dateBon, setDateBon] = useState(versChampDate(initial?.dateBon));
  const [dateLivraison, setDateLivraison] = useState(versChampDate(initial?.dateLivraison));
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const dateManquante = livre && !dateLivraison;

  function corps(): CadeauRequest {
    return {
      cadeauId: cadeauId ?? undefined,
      // Un autre cadeau choisi reprend le prix du catalogue.
      prix: cadeauId === (initial?.cadeauId ?? null) ? lireMontant(prix) : undefined,
      livre,
      raisonId: raisonId ?? undefined,
      dateBon: toApiDateTime(dateBon),
      dateLivraison: toApiDateTime(dateLivraison),
      notes: notes || undefined,
    };
  }

  return (
    <Modal title={initial ? 'Modifier le cadeau' : 'Ajouter un cadeau'} onClose={onFermer} width={520}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void onValider(corps());
        }}
      >
        <FieldGroup>
          <Champ id="cad-cadeau" libelle="Cadeau">
            <SearchableSelect id="cad-cadeau" items={optionsCatalogue(catalogue.data)} value={cadeauId} onValueChange={setCadeauId} placeholder="Choisir plus tard…" />
          </Champ>
          {initial && cadeauId === initial.cadeauId && (
            <Champ id="cad-prix" libelle="Prix">
              <Input id="cad-prix" inputMode="decimal" value={prix} onChange={(e) => setPrix(e.target.value)} />
            </Champ>
          )}
          <Champ id="cad-raison" libelle="Raison">
            <SearchableSelect
              id="cad-raison"
              items={optionsCatalogue(raisons.data)}
              value={raisonId}
              onValueChange={setRaisonId}
              disabled={!raisonModifiable}
            />
          </Champ>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Champ id="cad-bon" libelle="Date du bon">
              <Input id="cad-bon" type="date" value={dateBon} onChange={(e) => setDateBon(e.target.value)} />
            </Champ>
            <Champ id="cad-livraison" libelle={livre ? 'Date de livraison *' : 'Date de livraison'}>
              <Input
                id="cad-livraison"
                type="date"
                value={dateLivraison}
                aria-invalid={dateManquante}
                aria-describedby={dateManquante ? 'cad-livraison-erreur' : undefined}
                onChange={(e) => setDateLivraison(e.target.value)}
              />
              {dateManquante && (
                <span id="cad-livraison-erreur" className="text-micro text-(--warning)">Veuillez saisir une date de livraison</span>
              )}
            </Champ>
          </div>
          <label className="flex items-center gap-2 text-label">
            <input type="checkbox" checked={livre} onChange={(e) => setLivre(e.target.checked)} /> Livré
          </label>
          <Champ id="cad-notes" libelle="Notes">
            <Textarea id="cad-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Champ>
        </FieldGroup>
        <DialogFooter className="mt-5">
          <Button type="button" variant="outline" onClick={onFermer}>Annuler</Button>
          <Button type="submit" disabled={occupe || dateManquante}>Enregistrer</Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}
