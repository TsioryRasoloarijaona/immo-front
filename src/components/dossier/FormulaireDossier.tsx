import { Link } from 'react-router-dom';
import { Card } from '../ui';
import { ChampLecture, GrilleFiche, PiedFiche } from '../ChampsFiche';
import { formatCurrency, formatDate, formatPercent, formatPercentValue, formatSurface } from '../../lib/format';
import type { DossierDetailDto, EnTeteFicheDto } from '../../types';

function remise(e: EnTeteFicheDto | undefined): string | null {
  if (!e?.remiseMontantHT) return null;
  return `${formatCurrency(e.remiseMontantHT)} · ${formatPercentValue(e.remisePourcentage, 2)}`;
}

/** En-tête en lecture seule : prix de l'article et des sous-articles séparés, HT et TTC (FEATURE-vente-fiche.md §A1). */
export default function FormulaireDossier({
  dossier: d,
  enTete: e,
}: Readonly<{ dossier: DossierDetailDto; enTete?: EnTeteFicheDto }>) {
  const premierArticle = d.articles?.[0];
  const tranche = d.trancheLibelle || d.trancheCode;
  return (
    <Card padded={false} className="h-full">
      <div className="p-3">
        <GrilleFiche>
          <ChampLecture
            label="Tranche"
            valeur={
              d.trancheId ? (
                <Link to={`/tranches/${d.trancheId}`} className="text-(--info) hover:underline">{tranche}</Link>
              ) : (
                tranche
              )
            }
          />
          <ChampLecture label="Article" valeur={premierArticle?.code} aide="Le détail complet est dans l'onglet « Articles »." />
          <ChampLecture label="Catégorie" valeur={premierArticle?.categorieLibelle || premierArticle?.categorieCode} />
          <ChampLecture label="Titre foncier" valeur={premierArticle?.titreFoncier} aide="Numéro de titre foncier du lot." />

          <ChampLecture label="Présentation" valeur={premierArticle?.presentationLibelle || premierArticle?.presentationCode} />
          <ChampLecture label="Type" valeur={premierArticle?.typeLibelle || premierArticle?.typeCode} />
          <ChampLecture label="Superficie" valeur={e?.superficie ? formatSurface(e.superficie) : null} />
          <ChampLecture label="Prix du m² HT" valeur={e?.prixM2HT ? formatCurrency(e.prixM2HT) : null} />

          <ChampLecture label="Prix article HT" valeur={formatCurrency(e?.prixArticleHT)} />
          <ChampLecture label="Prix article TTC" valeur={formatCurrency(e?.prixArticleTTC)} />
          <ChampLecture label="Prix sous-articles HT" valeur={formatCurrency(e?.prixSousArticlesHT)} />
          <ChampLecture label="Prix sous-articles TTC" valeur={formatCurrency(e?.prixSousArticlesTTC)} />

          <ChampLecture label="Total HT" valeur={formatCurrency(e?.totalHT)} />
          <ChampLecture label="Total TTC" valeur={formatCurrency(e?.totalTTC)} />
          <ChampLecture label="Remise HT" valeur={remise(e)} />
          <ChampLecture
            label="TVA"
            valeur={d.tauxTVA ? formatPercent(d.tauxTVA, 2) : null}
            aide="Nul ou absent sur la majorité des dossiers — c'est une absence de saisie, pas un taux nul."
          />

          <ChampLecture label="Prix de vente HT" valeur={formatCurrency(e?.prixVenteHT)} />
          <ChampLecture label="Prix de vente TTC" valeur={formatCurrency(e?.prixVenteTTC)} />
          <ChampLecture
            label="Prix contractuel"
            valeur={formatCurrency(e?.prixContractuel)}
            aide="Somme des lignes du schéma de financement non exclues du prix contractuel."
          />
          <ChampLecture label="Mode de paiement" valeur={d.modePaie} />

          {d.notes && <ChampLecture label="Notes" valeur={d.notes} multiligne apres={16} />}
          <PiedFiche>
            <span>Réservé le {formatDate(d.dateDocument)}</span>
            <span aria-hidden>·</span>
            <span>commercial {d.commercialNom || '— non assigné —'}</span>
            {d.societeCode && (
              <>
                <span aria-hidden>·</span>
                <span>société {d.societeCode}</span>
              </>
            )}
          </PiedFiche>
        </GrilleFiche>
      </div>
    </Card>
  );
}
