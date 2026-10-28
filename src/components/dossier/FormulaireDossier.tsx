import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../ui';
import { Button } from '../ui/button';
import EnTeteDialog from './edition/EnTeteDialog';
import PrixDialog from './edition/PrixDialog';
import { useEditionDossier } from '../../lib/editionDossier';
import { ChampLecture, GrilleFiche, PiedFiche } from '../ChampsFiche';
import { formatCurrency, formatDate, formatPercent, formatPercentValue, formatSurface } from '../../lib/format';
import type { DossierDetailDto, EnTeteFicheDto } from '../../types';

function remise(e: EnTeteFicheDto | undefined): string | null {
  if (!e?.remiseMontantHT) return null;
  return `${formatCurrency(e.remiseMontantHT)} · ${formatPercentValue(e.remisePourcentage, 2)}`;
}

/**
 * Boutons « Date du dossier » (groupe DATES) et « Modifier la remise / TVA » (groupe PRIX), avertissement d'écart du
 * schéma après enregistrement.
 */
export function EditionEnTete({
  dossier: d,
  enTete: e,
  enRuban,
}: Readonly<{ dossier: DossierDetailDto; enTete?: EnTeteFicheDto; enRuban?: boolean }>) {
  const edition = useEditionDossier(d.id, e);
  const [ouvert, setOuvert] = useState<'prix' | 'date' | null>(null);
  const prix = edition.peut('PRIX');
  if (!e || !(prix || edition.peut('DATES'))) return null;
  return (
    <div className={enRuban ? 'flex items-center gap-1' : 'mb-1.5 flex flex-col items-end gap-1'}>
      <div className={enRuban ? 'flex gap-1' : 'flex flex-wrap justify-end gap-2'}>
        {edition.peut('DATES') && (
          <Button type="button" size="sm" variant="outline" onClick={() => setOuvert('date')}>
            <Pencil aria-hidden />
            Date du dossier
          </Button>
        )}
        {prix && (
          <Button type="button" size="sm" variant="outline" onClick={() => setOuvert('prix')}>
            <Pencil aria-hidden />
            Modifier la remise / TVA
          </Button>
        )}
      </div>
      {edition.ecart != null && (
        <p role="status" className={enRuban ? 'text-micro whitespace-nowrap text-(--warning)' : 'text-micro text-(--warning)'}>
          Écart du schéma de financement : {formatCurrency(edition.ecart)} à reporter dans l'échéancier.
        </p>
      )}
      {ouvert === 'prix' && (
        <PrixDialog
          edition={edition}
          remiseMontantHT={e.remiseMontantHT ?? 0}
          remisePourcentage={e.remisePourcentage ?? 0}
          prixVenteHT={e.prixVenteHT ?? 0}
          prixVenteTTC={e.prixVenteTTC ?? 0}
          tauxTva={d.tauxTVA ?? 0}
          onClose={() => setOuvert(null)}
        />
      )}
      {ouvert === 'date' && (
        <EnTeteDialog edition={edition} dateDossier={d.dateDocument} onClose={() => setOuvert(null)} />
      )}
    </div>
  );
}

/** En-tête : prix de l'article et des sous-articles séparés, HT et TTC (FEATURE-vente-fiche.md §A1). */
export default function FormulaireDossier({
  dossier: d,
  enTete: e,
}: Readonly<{ dossier: DossierDetailDto; enTete?: EnTeteFicheDto }>) {
  const premierArticle = d.articles?.[0];
  const tranche = d.trancheLibelle || d.trancheCode;
  return (
    <Card padded={false} className="h-full">
      <div className="p-2.5">
        <EditionEnTete dossier={d} enTete={e} />
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

          {d.notes && <ChampLecture label="Notes" valeur={d.notes} multiligne />}
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
