import { useState } from 'react';
import { Check, Pencil } from 'lucide-react';
import ModifierAffectationsDialog from './ModifierAffectationsDialog';
import { Badge, Card, EmptyState, ErrorState, LoadingState, ResultsRegion } from '../ui';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import type { AffectationsEquipeDto, MembreAffectationDto } from '../../types';

function LigneMembre({
  membre,
  projetIds,
  horsEquipe,
  onModifier,
}: Readonly<{
  membre: MembreAffectationDto;
  projetIds: readonly string[];
  horsEquipe?: boolean;
  onModifier: (m: MembreAffectationDto) => void;
}>) {
  return (
    <TableRow className="hover:bg-muted/40">
      <TableCell className="font-medium text-foreground">
        {membre.nom ?? membre.code}
        {horsEquipe && <span className="text-micro font-normal text-muted-foreground"> (hors équipe)</span>}
        {membre.sansRestriction && <Badge tone="info" className="ml-1.5">Tous projets</Badge>}
      </TableCell>
      {projetIds.map((id) => (
        <TableCell key={id} className="text-center">
          {membre.projetIds.includes(id) ? <Check aria-label="affecté" className="mx-auto size-3.5 text-(--success)" /> : null}
        </TableCell>
      ))}
      <TableCell className="text-right">
        {membre.modifiable ? (
          <Button type="button" variant="ghost" size="sm" onClick={() => onModifier(membre)}>
            <Pencil data-icon="inline-start" /> Modifier
          </Button>
        ) : (
          <span className="text-micro text-muted-foreground">géré par l’administrateur</span>
        )}
      </TableCell>
    </TableRow>
  );
}

/** Matrice commerciaux × projets de l'appelant ; « hors équipe » = commerciaux qu'un chef peut ajouter. */
export default function AffectationsEquipe({
  data,
  loading,
  error,
  onFait,
}: Readonly<{ data: AffectationsEquipeDto | null; loading: boolean; error: string | null; onFait: () => void }>) {
  const [edition, setEdition] = useState<MembreAffectationDto | null>(null);
  const projetIds = data?.projets.map((p) => p.id) ?? [];

  return (
    <Card title="Affectation aux projets" padded={false}>
      {loading && !data && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!error && data && (
        <ResultsRegion loading={loading}>
          {data.projets.length === 0 ? (
            <EmptyState title="Aucun projet" message="Aucun projet ne vous est affecté : demandez-le à un administrateur." />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Commercial</TableHead>
                    {data.projets.map((p) => (
                      <TableHead key={p.id} className="text-center" title={p.libelle}>{p.code}</TableHead>
                    ))}
                    <TableHead className="text-right">
                      <span className="sr-only">Action</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.commerciaux.map((m) => (
                    <LigneMembre key={m.admUserId} membre={m} projetIds={projetIds} onModifier={setEdition} />
                  ))}
                  {data.affectables.map((m) => (
                    <LigneMembre key={m.admUserId} membre={m} projetIds={projetIds} horsEquipe onModifier={setEdition} />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </ResultsRegion>
      )}
      {edition && data && (
        <ModifierAffectationsDialog membre={edition} projets={data.projets} onClose={() => setEdition(null)} onFait={onFait} />
      )}
    </Card>
  );
}
