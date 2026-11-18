import { Link } from 'react-router-dom';
import FenetreFiche from '../fiche/FenetreFiche';
import { Card, Field, FieldGrid } from '../ui';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import EtatReglement from './EtatReglement';
import { getDecaissement } from '../../lib/apiTresorerie';
import { formatCurrency, formatDate, pluriel } from '../../lib/format';
import { accesRefuse } from '../../lib/tresorerie';
import type { VoisinsFiche } from '../../lib/fenetreFiche';
import { EtatFiche } from '../../pages/projet/commun';
import { useFiche } from '../../pages/projet/hooks';
import type { ModuleTresorerie, PieceTresorerieDto } from '../../types/tresorerie';

function lienPiece(module: ModuleTresorerie, id: string): string {
  return module === 'PRJ' ? `/projet/depenses/factures/${id}` : `/achat/documents/${id}`;
}

export function LibellePiece({ piece, module }: Readonly<{ piece: PieceTresorerieDto | null; module: ModuleTresorerie }>) {
  if (!piece) return <span className="text-muted-foreground">—</span>;
  return (
    <Link className="underline" to={lienPiece(module, piece.id)} onClick={(e) => e.stopPropagation()}>
      {[piece.type, piece.libelle].filter(Boolean).join(' · ') || '—'}
    </Link>
  );
}

/** Fiche d'un décaissement, en lecture : en-tête du règlement puis ses lignes d'affectation visibles. */
export default function FicheDecaissementFenetre({
  id,
  module,
  voisins,
  onFermer,
}: Readonly<{ id: string; module: ModuleTresorerie; voisins?: VoisinsFiche; onFermer: () => void }>) {
  const etat = useFiche(() => accesRefuse(getDecaissement(id)), id);
  const d = etat.data?.decaissement;
  return (
    <FenetreFiche
      nature="Décaissement"
      titre={d?.code ?? '—'}
      badge={d && <EtatReglement statut={d.statut} libelle={d.statutLibelle} enRetard={d.enRetard} nonAffecte={d.nonAffecte} />}
      voisins={voisins}
      onFermer={onFermer}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-4">
        <EtatFiche etat={etat}>
          {(f) => (
            <>
              <Card title="Règlement">
                <FieldGrid>
                  <Field label="Code" value={f.decaissement.code} />
                  <Field label="Société" value={f.decaissement.societe} />
                  <Field label="Type" value={f.decaissement.type} />
                  <Field label="Tiers" value={f.decaissement.tiers} />
                  <Field label="Banque" value={f.decaissement.banque} />
                  <Field label="Compte" value={f.decaissement.compte} />
                  <Field label="Date de la pièce" value={formatDate(f.decaissement.datePiece)} />
                  <Field label="Échéance" value={formatDate(f.decaissement.echeance)} />
                  <Field label="Date de pointage" value={formatDate(f.decaissement.datePointage)} />
                  <Field label="Date de mouvement" value={formatDate(f.decaissement.dateMouvement)} />
                  <Field label="Montant" value={formatCurrency(f.decaissement.montant)} />
                  <Field label="Montant affecté" value={formatCurrency(f.decaissement.montantAffecte)} />
                  <Field label="Reste à affecter" value={formatCurrency(f.decaissement.resteAAffecter)} />
                  <Field label="Comptabilisé" value={f.decaissement.comptabilise ? 'Oui' : 'Non'} />
                  <Field label="N° de reçu" value={f.codeRecu} />
                  <Field label="Devise" value={f.devise} />
                  <Field label="Description" value={f.decaissement.description} />
                  <Field label="Notes" value={f.notes} />
                </FieldGrid>
              </Card>
              <Card title="Affectations" padded={false}>
                {f.lignes.length === 0 ? (
                  <p className="px-4 py-3 text-body text-muted-foreground">Aucune affectation visible.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pièce</TableHead>
                        <TableHead>Fournisseur</TableHead>
                        <TableHead>Projet</TableHead>
                        <TableHead>Lot</TableHead>
                        <TableHead className="text-right">Montant affecté</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {f.lignes.map((l) => (
                        <TableRow key={l.id}>
                          <TableCell>
                            <LibellePiece piece={l.piece} module={module} />
                          </TableCell>
                          <TableCell>{l.fournisseur ?? '—'}</TableCell>
                          <TableCell>{l.projet ?? '—'}</TableCell>
                          <TableCell>{l.lot ?? '—'}</TableCell>
                          <TableCell className="text-right tabular-nums">{formatCurrency(l.montantAffecte)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                {f.lignesMasquees > 0 && (
                  <p className="border-t border-border px-4 py-2 text-micro text-muted-foreground">
                    {pluriel(f.lignesMasquees, 'ligne')} masquée{f.lignesMasquees > 1 ? 's' : ''} (hors de votre périmètre).
                  </p>
                )}
              </Card>
            </>
          )}
        </EtatFiche>
      </div>
    </FenetreFiche>
  );
}
