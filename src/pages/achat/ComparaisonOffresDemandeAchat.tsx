import { EmptyState, ErrorState, LoadingState } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { getComparaisonDemandeAchat } from '../../lib/apiDemandesAchat';
import { formatCurrency } from '../../lib/format';
import { useApi } from '../../lib/useApi';
import type { LigneOffreDemandeAchat, OffreDemandeAchat } from '../../types/demandesAchat';

interface LigneComparee {
  code: string;
  designation: string;
  parOffre: Map<string, LigneOffreDemandeAchat>;
}

function prix(l: LigneOffreDemandeAchat | undefined): number | null {
  return l ? (l.prixApresRemiseHT ?? l.prixUnitaireHT) : null;
}

/** Lignes regroupées par code de bordereau, dans l'ordre de la première offre qui les porte. */
function comparer(offres: OffreDemandeAchat[]): LigneComparee[] {
  const parCode = new Map<string, LigneComparee>();
  for (const o of offres) {
    for (const l of o.lignes) {
      const code = l.code ?? '';
      const ligne = parCode.get(code) ?? { code, designation: l.designation ?? '', parOffre: new Map() };
      ligne.parOffre.set(o.id, l);
      parCode.set(code, ligne);
    }
  }
  return [...parCode.values()];
}

function meilleurPrix(ligne: LigneComparee): number | null {
  const prixPresents = [...ligne.parOffre.values()].map(prix).filter((p): p is number => p !== null);
  return prixPresents.length > 0 ? Math.min(...prixPresents) : null;
}

/** Comparaison en lecture seule des offres non écartées, ligne de bordereau par ligne ; le meilleur prix unitaire est en gras. */
export default function ComparaisonOffresDemandeAchat({ id, onFermer }: Readonly<{ id: string; onFermer: () => void }>) {
  const comparaison = useApi(() => getComparaisonDemandeAchat(id), [id]);
  const offres = comparaison.data ?? [];
  const lignes = comparer(offres);
  return (
    <Dialog open onOpenChange={(ouvert) => !ouvert && onFermer()}>
      <DialogContent className="max-w-5xl">
        <DialogHeader><DialogTitle>Comparaison des offres</DialogTitle></DialogHeader>
        {comparaison.error && <ErrorState message={comparaison.error} />}
        {!comparaison.error && !comparaison.data && <LoadingState />}
        {!comparaison.error && comparaison.data && lignes.length === 0 && <EmptyState title="Aucune offre à comparer" />}
        {!comparaison.error && lignes.length > 0 && (
          <div className="max-h-[60vh] overflow-auto">
            <table className="w-full text-body">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-1.5 py-1">Code</th>
                  <th className="px-1.5 py-1">Désignation</th>
                  {offres.map((o) => <th key={o.id} className="px-1.5 py-1 text-right">{o.fournisseur?.libelle ?? o.code ?? '—'}</th>)}
                </tr>
              </thead>
              <tbody>
                {lignes.map((l) => {
                  const meilleur = meilleurPrix(l);
                  return (
                    <tr key={l.code} className="border-b border-border/50">
                      <td className="px-1.5 py-1">{l.code}</td>
                      <td className="px-1.5 py-1">{l.designation}</td>
                      {offres.map((o) => {
                        const p = prix(l.parOffre.get(o.id));
                        return (
                          <td key={o.id} className={`px-1.5 py-1 text-right tabular-nums ${p !== null && p === meilleur ? 'font-bold' : ''}`}>
                            {p === null ? '—' : formatCurrency(p)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="font-semibold">
                  <td className="px-1.5 py-1" colSpan={2}>Total HT</td>
                  {offres.map((o) => <td key={o.id} className="px-1.5 py-1 text-right tabular-nums">{formatCurrency(o.totalHT)}</td>)}
                </tr>
                <tr className="font-semibold">
                  <td className="px-1.5 py-1" colSpan={2}>Total TTC</td>
                  {offres.map((o) => <td key={o.id} className="px-1.5 py-1 text-right tabular-nums">{formatCurrency(o.totalTTC)}</td>)}
                </tr>
              </tfoot>
            </table>
          </div>
        )}
        <DialogFooter><Button type="button" variant="outline" onClick={onFermer}>Fermer</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
