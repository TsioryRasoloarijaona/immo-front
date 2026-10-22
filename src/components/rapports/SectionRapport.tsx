import { useState } from 'react';
import { Card } from '../ui';
import { Input } from '../ui/input';
import type { SectionRapportDto } from '../../types/rapports';
import GraphiqueRapport from './GraphiqueRapport';
import TableRapport from './TableRapport';

const SEUIL_FILTRE = 8;

/** Une carte par section : graphiques déclarés, filtre de lignes, tableau avec totaux du serveur. */
export default function SectionRapport({ section }: Readonly<{ section: SectionRapportDto }>) {
  const [filtre, setFiltre] = useState('');
  const vide = section.lignes.length === 0;
  return (
    <Card
      title={section.titre}
      action={
        section.lignes.length > SEUIL_FILTRE && (
          <Input type="search" aria-label={`Filtrer ${section.titre}`} placeholder="Filtrer…" className="h-7 w-40" value={filtre} onChange={(e) => setFiltre(e.target.value)} />
        )
      }
      padded={false}
    >
      {vide ? (
        <p className="px-4 py-6 text-center text-body text-muted-foreground">Aucune donnée pour ces filtres.</p>
      ) : (
        <div className="flex flex-col gap-4 py-3">
          {section.graphiques.length > 0 && (
            <div className="flex flex-col gap-4 px-4">
              {section.graphiques.map((g, i) => (
                <GraphiqueRapport key={`${g.titre}-${i}`} section={section} graphique={g} />
              ))}
            </div>
          )}
          <TableRapport section={section} filtre={filtre} />
        </div>
      )}
    </Card>
  );
}
