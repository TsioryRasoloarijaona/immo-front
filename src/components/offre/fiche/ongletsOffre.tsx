import LienFiche from '../../LienFiche';
import { Badge, EmptyState, Field, FieldGrid } from '../../ui';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { formatCurrency, formatDateTime, formatSurface } from '../../../lib/format';
import type { FicheDevisDto } from '../../../types';

/** D1 : une offre liée à un dossier reste modifiable mais ne se supprime plus (409 serveur). */
export function BarreOffre({ fiche, erreur }: Readonly<{ fiche: FicheDevisDto; erreur: string | null }>) {
  const dossier = fiche.dossierLie;
  if (!dossier && !erreur) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border border-(--info-border) bg-(--info-bg) px-3 py-2">
      {dossier && (
        <>
          {dossier.id ? (
            <LienFiche cible={{ type: 'dossier', id: dossier.id }} className="text-label font-medium text-(--info) hover:underline">
              Dossier {dossier.code}
            </LienFiche>
          ) : (
            <span className="text-label font-medium text-foreground">Dossier de location {dossier.code}</span>
          )}
          <span className="text-micro text-muted-foreground">
            Offre transformée en dossier : modification possible, suppression impossible.
          </span>
        </>
      )}
      {erreur && <span className="text-micro text-destructive">{erreur}</span>}
    </div>
  );
}

export function TracabiliteOffre({ fiche }: Readonly<{ fiche: FicheDevisDto }>) {
  const o = fiche.offre;
  return (
    <FieldGrid>
      <Field label="Créée par" value={o.creePar} />
      <Field label="Créée le" value={formatDateTime(o.creeLe)} />
      <Field label="Modifiée par" value={o.modifiePar} />
      <Field label="Modifiée le" value={formatDateTime(o.modifieLe)} />
    </FieldGrid>
  );
}

export function SousArticles({ fiche }: Readonly<{ fiche: FicheDevisDto }>) {
  if (fiche.sousArticles.length === 0) {
    return <EmptyState title="Aucun sous-article" message="Cette offre ne porte que son article principal." />;
  }
  return (
    <Table containerClassName="overflow-visible">
      <TableHeader className="sticky top-0 z-1">
        <TableRow className="hover:bg-card">
          <TableHead>Code</TableHead>
          <TableHead>Désignation</TableHead>
          <TableHead>Catégorie</TableHead>
          <TableHead className="text-right">Superficie</TableHead>
          <TableHead className="text-right">Avant remise TTC</TableHead>
          <TableHead className="text-right">Remise TTC</TableHead>
          <TableHead className="text-right">Après remise TTC</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {fiche.sousArticles.map((s) => (
          <TableRow key={s.id}>
            <TableCell className="font-mono">{s.code}</TableCell>
            <TableCell className="text-muted-foreground">{s.description}</TableCell>
            <TableCell>{s.categorie ? <Badge tone="neutral">{s.categorie}</Badge> : null}</TableCell>
            <TableCell className="text-right tabular-nums">{s.superficie == null ? '—' : formatSurface(s.superficie)}</TableCell>
            <TableCell className="text-right tabular-nums">{formatCurrency(s.prixAvantRemiseTTC)}</TableCell>
            <TableCell className="text-right tabular-nums text-muted-foreground">{formatCurrency(s.remiseTTC)}</TableCell>
            <TableCell className="text-right font-semibold tabular-nums">{formatCurrency(s.prixApresRemiseTTC)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function SchemaOffre({ fiche }: Readonly<{ fiche: FicheDevisDto }>) {
  const lignes = fiche.offre.schemaFinancement ?? [];
  if (lignes.length === 0) {
    return <EmptyState title="Pas de schéma" message="L'offre n'a pas de prix : aucun schéma de financement à calculer." />;
  }
  return (
    <>
      <p className="border-b border-border px-3 py-2 text-micro text-muted-foreground">
        {fiche.schemaFinancementSaisi
          ? 'Schéma saisi dans OMRAN : un changement de prix doit le respecter, sinon la modification est refusée.'
          : 'Schéma calculé depuis les pourcentages de la tranche, sur le prix TTC après remise.'}
      </p>
      <Table containerClassName="overflow-visible">
        <TableHeader className="sticky top-0 z-1">
          <TableRow className="hover:bg-card">
            <TableHead>Catégorie</TableHead>
            <TableHead className="text-right">Montant</TableHead>
            <TableHead>Prix</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lignes.map((l, i) => (
            <TableRow key={`${l.categorie ?? ''}-${i}`}>
              <TableCell>{l.categorie}</TableCell>
              <TableCell className="text-right font-semibold tabular-nums">{formatCurrency(l.montant)}</TableCell>
              <TableCell className="text-muted-foreground">{l.exclureDuPrix ? 'Hors prix' : 'Dans le prix'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
