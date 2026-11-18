import { Input } from '../../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { majAvancement } from '../../../lib/apiReunions';
import type { EcrireFiche } from '../../../lib/saisieReunion';
import type { ReferentielItemDto } from '../../../types';
import type { ReunionFicheDto } from '../../../types/reunions';

const libelleReferentiel = (r: ReferentielItemDto) => r.description || r.code || '—';

/** Lignes = critères, colonnes = niveaux ; cellule en % (vide ou 0 = absent), écrite à la sortie du champ. */
export default function OngletAvancements({ fiche, ecrire }: Readonly<{ fiche: ReunionFicheDto; ecrire: EcrireFiche }>) {
  const { criteres, niveaux, valeurs } = fiche.avancements;
  const valeur = (critereId: string, niveauId: string) =>
    valeurs.find((v) => v.critereId === critereId && v.niveauId === niveauId)?.pourcentage ?? null;

  function sortir(critereId: string, niveauId: string, avant: number | null, texte: string) {
    const saisi = texte.trim() === '' ? null : Number(texte.replace(',', '.'));
    if (saisi === avant || (saisi === 0 && avant === null) || (saisi !== null && Number.isNaN(saisi))) return;
    void ecrire(() => majAvancement(fiche.id, { critereId, niveauId, pourcentage: saisi }));
  }

  if (criteres.length === 0 || niveaux.length === 0) {
    return <p className="text-body text-muted-foreground">Aucun critère ou niveau d'avancement défini pour ce projet.</p>;
  }
  return (
    <div className="overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Critère</TableHead>
            {niveaux.map((n) => <TableHead key={n.id} className="text-right">{libelleReferentiel(n)}</TableHead>)}
          </TableRow>
        </TableHeader>
        <TableBody>
          {criteres.map((c) => (
            <TableRow key={c.id}>
              <TableCell>{libelleReferentiel(c)}</TableCell>
              {niveaux.map((n) => {
                const avant = valeur(c.id, n.id);
                return (
                  <TableCell key={n.id} className="text-right">
                    <Input key={String(avant)} type="number" min={0} max={100} step="any" className="ml-auto h-6 w-20 text-right"
                      aria-label={`${libelleReferentiel(c)} — ${libelleReferentiel(n)} (%)`} defaultValue={avant ?? ''}
                      onBlur={(e) => sortir(c.id, n.id, avant, e.target.value)} />
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
