import type { ReactNode } from 'react';
import { Field, FieldGrid } from '../../ui';
import { formatCurrency, formatPercent, formatPercentValue, formatSurface } from '../../../lib/format';
import type { ApiState } from '../../../lib/useApi';
import type { DossierFicheDto } from '../../../types';
import ContenuFiche from './ContenuFiche';

function Section({ titre, children }: Readonly<{ titre: string; children: ReactNode }>) {
  return (
    <section>
      <h3 className="mb-2 text-micro font-medium text-muted-foreground">{titre}</h3>
      <FieldGrid>{children}</FieldGrid>
    </section>
  );
}

/** Onglet « Autres montants » de l'écran OMRAN (aide l.6649-6664). */
export default function OngletAutresMontants({ fiche }: Readonly<{ fiche: ApiState<DossierFicheDto> }>) {
  return (
    <ContenuFiche fiche={fiche}>
      {({ autresMontants: m }) => (
        <>
          <Section titre="Superficie et TVA">
            <Field label="Superficie" value={formatSurface(m.superficie)} />
            <Field label="Superficie globale" value={formatSurface(m.superficieGlobale)} />
            <Field label="TVA" value={formatPercent(m.tauxTva, 2)} />
            <Field label="Prix article m² HT" value={formatCurrency(m.prixArticleM2HT)} />
            <Field label="Prix article m² TTC" value={formatCurrency(m.prixArticleM2TTC)} />
          </Section>
          <Section titre="Avant remise">
            <Field label="Prix article HT" value={formatCurrency(m.prixArticleHT)} />
            <Field label="Prix article TTC" value={formatCurrency(m.prixArticleTTC)} />
            <Field label="Prix sous-articles HT" value={formatCurrency(m.prixSousArticlesHT)} />
            <Field label="Prix sous-articles TTC" value={formatCurrency(m.prixSousArticlesTTC)} />
            <Field label="Total HT" value={formatCurrency(m.totalHT)} />
            <Field label="Total TTC" value={formatCurrency(m.totalTTC)} />
          </Section>
          <Section titre="Après remise">
            <Field label="Remise" value={formatPercentValue(m.remisePourcentage)} />
            <Field label="Prix article HT" value={formatCurrency(m.prixArticleApresRemiseHT)} />
            <Field label="Prix article TTC" value={formatCurrency(m.prixArticleApresRemiseTTC)} />
            <Field label="Prix sous-articles HT" value={formatCurrency(m.prixSousArticlesApresRemiseHT)} />
            <Field label="Prix sous-articles TTC" value={formatCurrency(m.prixSousArticlesApresRemiseTTC)} />
            <Field label="Prix de vente HT" value={formatCurrency(m.prixVenteHT)} />
            <Field label="Prix de vente TTC" value={formatCurrency(m.prixVenteTTC)} />
            <Field label="Prix de vente m² HT" value={formatCurrency(m.prixVenteM2HT)} />
            <Field label="Prix de vente m² TTC" value={formatCurrency(m.prixVenteM2TTC)} />
          </Section>
        </>
      )}
    </ContenuFiche>
  );
}
