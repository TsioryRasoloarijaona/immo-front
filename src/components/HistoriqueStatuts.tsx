import { Badge } from './ui';
import LienFiche from './LienFiche';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { canonicalStatusLabel, toneForStatus } from '../lib/dossierStatus';
import { formatDateTime } from '../lib/format';
import { LIBELLE_ORIGINE } from '../lib/articleOnglets';
import type { ArticleHistoriqueDto } from '../types/articleOnglets';

/** Historique des statuts de dossier d'un tiers ou d'un article ; `HistoriqueDto` est accepté tel quel. */
export default function HistoriqueStatuts({ lignes, avecOrigine = false, sansArticle = false }: Readonly<{
  lignes: readonly ArticleHistoriqueDto[];
  /** Ajoute les colonnes Origine et Client. */
  avecOrigine?: boolean;
  sansArticle?: boolean;
}>) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Utilisateur</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>État</TableHead>
            {avecOrigine && <TableHead>Origine</TableHead>}
            <TableHead>N° Dossier</TableHead>
            {avecOrigine && <TableHead>Client</TableHead>}
            {!sansArticle && <TableHead>Article</TableHead>}
            <TableHead>Détails</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lignes.map((h) => {
            const etat = canonicalStatusLabel(h.statutDescription);
            return (
              <TableRow key={h.id}>
                <TableCell className="text-foreground">{h.utilisateur ?? 'Système'}</TableCell>
                <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">{formatDateTime(h.date)}</TableCell>
                <TableCell>{etat ? <Badge tone={toneForStatus(etat)}>{etat}</Badge> : '—'}</TableCell>
                {avecOrigine && <TableCell>{h.origine ? LIBELLE_ORIGINE[h.origine] : '—'}</TableCell>}
                <TableCell className="whitespace-nowrap">
                  {h.dossierId ? (
                    <LienFiche cible={{ type: 'dossier', id: h.dossierId }} className="font-medium text-(--brand) hover:underline">
                      {h.dossierCode || 'Voir le dossier'}
                    </LienFiche>
                  ) : (
                    h.dossierCode || '—'
                  )}
                </TableCell>
                {avecOrigine && <TableCell>{h.client || '—'}</TableCell>}
                {!sansArticle && <TableCell className="whitespace-nowrap text-muted-foreground">{h.articleCode || '—'}</TableCell>}
                <TableCell className="text-muted-foreground">{h.description || '—'}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
