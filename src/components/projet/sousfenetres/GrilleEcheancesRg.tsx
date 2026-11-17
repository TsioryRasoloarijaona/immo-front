import { useEffect, useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import BarreIcones from '../../BarreIcones';
import { Button } from '../../ui/button';
import { putEcheancesRgLot } from '../../../lib/apiProjet';
import { formatDate, formatPercentValue, jourISO } from '../../../lib/format';
import { useConfirmationSortie } from '../../../lib/useConfirmationSortie';
import { errorMessage, refetchAllApis } from '../../../lib/useApi';
import type { EcheanceRgLotDto, EcheanceRgSaisieDto } from '../../../types/projet';

const CHAMP = 'h-6 w-full min-w-0 rounded-sm border border-transparent bg-transparent px-1 text-body hover:border-border focus:border-ring focus:outline-none';
const ENTETE = 'px-1 py-1 text-left text-micro font-medium text-muted-foreground';

type Ligne = Omit<EcheanceRgSaisieDto, 'id'> & { id: string };

function depuis(echeances: EcheanceRgLotDto[]): Ligne[] {
  return echeances.map((e) => ({ id: e.id, ordre: e.ordre, description: e.description, delaiJours: e.delaiJours, echeance: e.echeance, pourcentage: e.pourcentage }));
}

/** Échéances de remboursement de la retenue de garantie : l'ordre des lignes fait le rang. */
export default function GrilleEcheancesRg({
  lotId,
  echeances,
  dateReceptionDefinitive,
  onModifie,
}: Readonly<{ lotId: string; echeances: EcheanceRgLotDto[]; dateReceptionDefinitive: string | null; onModifie?: (modifie: boolean) => void }>) {
  const [lignes, setLignes] = useState<Ligne[]>(() => depuis(echeances));
  const [modifie, setModifie] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const total = lignes.reduce((s, l) => s + (l.pourcentage ?? 0), 0);
  useConfirmationSortie(modifie);
  useEffect(() => onModifie?.(modifie), [modifie, onModifie]);

  function muter(fn: (l: Ligne[]) => Ligne[]) {
    setLignes(fn);
    setModifie(true);
    setErreur(null);
  }
  const changer = (id: string, patch: Partial<Ligne>) => muter((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  const nombre = (v: string) => (v === '' ? null : Number(v));

  function echeanceDepuisDelai(delai: number | null): string | null {
    if (delai === null || !dateReceptionDefinitive) return null;
    const [a, m, j] = dateReceptionDefinitive.slice(0, 10).split('-').map(Number);
    return jourISO(new Date(a, m - 1, j + delai));
  }

  async function enregistrer() {
    setEnCours(true);
    setErreur(null);
    try {
      const reponse = await putEcheancesRgLot(lotId, lignes.map((l, i) => ({ ...l, ordre: i + 1 })));
      setLignes(depuis(reponse.echeances));
      setModifie(false);
      refetchAllApis();
    } catch (err: unknown) {
      setErreur(errorMessage(err));
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <BarreIcones className="flex items-center gap-1">
        <Button type="button" variant="ghost" size="sm" disabled={enCours || !modifie} onClick={() => void enregistrer()}>
          <Save /> Enregistrer
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => muter((ls) => [...ls, { id: crypto.randomUUID(), ordre: ls.length + 1, description: `Échéance ${ls.length + 1}`, delaiJours: null, echeance: null, pourcentage: null }])}
        >
          <Plus /> Ajouter
        </Button>
      </BarreIcones>
      {erreur && (
        <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-body text-destructive">
          {erreur}
        </div>
      )}
      <p className="text-body text-muted-foreground">Date de réception définitive : {formatDate(dateReceptionDefinitive)}</p>
      {lignes.length > 0 && Math.abs(total - 100) > 1e-6 && (
        <p role="status" className="text-body text-muted-foreground">
          Attention : le total des pourcentages est de {formatPercentValue(total)} (100 % attendus).
        </p>
      )}
      <div className="overflow-auto rounded-md border">
        <table className="w-full border-collapse text-body">
          <thead>
            <tr className="border-b">
              <th className={ENTETE}>Description</th>
              <th className={ENTETE}>Délai (jours)</th>
              <th className={ENTETE}>Échéance</th>
              <th className={ENTETE}>%</th>
              <th className={ENTETE} />
            </tr>
          </thead>
          <tbody>
            {lignes.map((l) => (
              <tr key={l.id} className="border-b last:border-b-0">
                <td>
                  <input type="text" aria-label="Description" className={CHAMP} value={l.description ?? ''} onChange={(e) => changer(l.id, { description: e.target.value })} />
                </td>
                <td>
                  <input type="number" aria-label="Délai en jours" className={CHAMP} value={l.delaiJours ?? ''} onChange={(e) => {
                      const delai = nombre(e.target.value);
                      changer(l.id, { delaiJours: delai, echeance: echeanceDepuisDelai(delai) });
                    }}
                  />
                </td>
                <td>
                  <input type="date" aria-label="Échéance" className={CHAMP} value={l.echeance ?? ''} onChange={(e) => changer(l.id, { echeance: e.target.value || null, delaiJours: null })} />
                </td>
                <td>
                  <input type="number" step="any" aria-label="Pourcentage" className={CHAMP} value={l.pourcentage ?? ''} onChange={(e) => changer(l.id, { pourcentage: nombre(e.target.value) })} />
                </td>
                <td>
                  <Button type="button" variant="ghost" size="sm" aria-label="Supprimer l'échéance" title="Supprimer" onClick={() => muter((ls) => ls.filter((x) => x.id !== l.id))}>
                    <Trash2 />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
