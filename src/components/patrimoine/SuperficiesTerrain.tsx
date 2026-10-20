import { Field, FieldGrid } from '../ui';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { formatCurrency, formatPercent, formatSurface, libelleTrace } from '../../lib/format';
import type { TerrainDetailDto } from '../../types/terrains';

const paire = (ht?: number | null, ttc?: number | null) => `${formatCurrency(ht)} / ${formatCurrency(ttc)}`;

/** Onglet Superficies (Lotissements si le terrain n'est pas terminé) : surfaces, valorisations et sous-terrains. */
export default function SuperficiesTerrain({ terrain: t, onOuvrir }: Readonly<{ terrain: TerrainDetailDto; onOuvrir: (id: string) => void }>) {
  const sousTerrains = t.sousTerrains ?? [];
  return (
    <div className="flex flex-col gap-4">
      <FieldGrid>
        <Field label="Surface provisoire" value={formatSurface(t.surfaceProvisoire)} />
        <Field label="Prix au m² provisoire HT / TTC" value={paire(t.prixM2ProvisoireHT, t.prixM2ProvisoireTTC)} />
        <Field label="Prix provisoire HT / TTC" value={paire(t.prixProvisoireHT, t.prixProvisoireTTC)} />
        <Field label="Surface définitive" value={formatSurface(t.surfaceDefinitive)} />
        <Field label="Prix au m² définitif HT / TTC" value={paire(t.prixM2DefinitifHT, t.prixM2DefinitifTTC)} />
        <Field label="Prix définitif HT / TTC" value={paire(t.prixDefinitifHT, t.prixDefinitifTTC)} />
        <Field label="TVA" value={formatPercent(t.tauxTva, 2)} />
        <Field label="Prospection foncière" value={t.prospectionFonciereId ? 'Issu d’une prospection foncière' : undefined} />
        <Field label="Créé par" value={libelleTrace(t.userCreate, t.userCreateDateTime)} />
        <Field label="Modifié par" value={libelleTrace(t.userUpdate, t.userUpdateDateTime)} />
      </FieldGrid>
      {sousTerrains.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sous-terrain</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Surface définitive</TableHead>
              <TableHead>Prix définitif TTC</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sousTerrains.map((s) => (
              <TableRow key={s.id}>
                <TableCell>
                  <Button type="button" variant="link" size="sm" onClick={() => onOuvrir(s.id)}>{s.code}</Button>
                </TableCell>
                <TableCell>{s.description}</TableCell>
                <TableCell>{formatSurface(s.surfaceDefinitive)}</TableCell>
                <TableCell>{formatCurrency(s.prixDefinitifTTC)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
