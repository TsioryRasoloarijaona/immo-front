import { ErrorState, LoadingState } from '../../ui';
import ChampFiche, { BandeFiche } from '../../fiche/ChampFiche';
import ClasseurEntete, { type OngletEntete } from '../../fiche/ClasseurEntete';
import SyntheseMontants from '../../SyntheseMontants';
import OngletAnnulation from '../onglets/OngletAnnulation';
import OngletAutres from '../onglets/OngletAutres';
import OngletAutresMontants from '../onglets/OngletAutresMontants';
import OngletDates from '../onglets/OngletDates';
import OngletDatesAutres from '../onglets/OngletDatesAutres';
import { canonicalStatusLabel } from '../../../lib/dossierStatus';
import { formatCurrency, formatDate, formatDateTime, formatPercent, formatPercentValue } from '../../../lib/format';
import type { ApiState } from '../../../lib/useApi';
import type { DossierDetailDto, DossierFicheDto, EnTeteFicheDto, MontantsDossierDto } from '../../../types';

function remise(e: EnTeteFicheDto | undefined): string | null {
  if (!e?.remiseMontantHT) return null;
  return `${formatCurrency(e.remiseMontantHT)} · ${formatPercentValue(e.remisePourcentage, 2)}`;
}

function Montants({ montants, probabilite }: Readonly<{ montants: ApiState<MontantsDossierDto>; probabilite?: number }>) {
  if (montants.error) return <ErrorState message={montants.error} />;
  if (!montants.data) return <LoadingState />;
  return <SyntheseMontants montants={montants.data} probabiliteFinalisation={probabilite} />;
}

function Tarification({ e }: Readonly<{ e?: EnTeteFicheDto }>) {
  return (
    <BandeFiche>
      <ChampFiche libelle="Prix du m² HT" type="montant" valeur={e?.prixM2HT ? formatCurrency(e.prixM2HT) : null} />
      <ChampFiche libelle="Prix article HT" type="montant" valeur={formatCurrency(e?.prixArticleHT)} />
      <ChampFiche libelle="Prix article TTC" type="montant" valeur={formatCurrency(e?.prixArticleTTC)} />
      <ChampFiche libelle="Sous-articles HT" type="montant" valeur={formatCurrency(e?.prixSousArticlesHT)} />
      <ChampFiche libelle="Sous-articles TTC" type="montant" valeur={formatCurrency(e?.prixSousArticlesTTC)} />
      <ChampFiche libelle="Total HT" type="montant" valeur={formatCurrency(e?.totalHT)} />
      <ChampFiche libelle="Total TTC" type="montant" valeur={formatCurrency(e?.totalTTC)} />
      <ChampFiche libelle="Remise HT" type="montant" valeur={remise(e)} />
      <ChampFiche libelle="Prix vente HT" type="montant" valeur={formatCurrency(e?.prixVenteHT)} />
    </BandeFiche>
  );
}

function StatutEtJalons({ d, fiche }: Readonly<{ d: DossierDetailDto; fiche: DossierFicheDto | null }>) {
  const prefixe = fiche?.statut.expire ? 'expiré depuis le' : "valide jusqu'au";
  const validite = d.dateValiditeStatut ? `${prefixe} ${formatDate(d.dateValiditeStatut)}` : null;
  return (
    <BandeFiche>
      <ChampFiche libelle="Réservation" valeur={formatDate(d.dateDocument)} />
      <ChampFiche libelle="Prospection" valeur={formatDate(d.dateProspection)} />
      <ChampFiche libelle="Statut" valeur={canonicalStatusLabel(d.statut)} />
      <ChampFiche libelle="Validité du statut" valeur={validite} />
      <ChampFiche libelle="Étapes atteignables" valeur={d.etapesAtteignables?.join(', ')} large />
    </BandeFiche>
  );
}

function Autres({ d, fiche }: Readonly<{ d: DossierDetailDto; fiche: ApiState<DossierFicheDto> }>) {
  const article = d.articles?.[0];
  return (
    <>
      <BandeFiche className="p-3 pb-0">
        <ChampFiche libelle="Titre foncier" valeur={article?.titreFoncier} />
        <ChampFiche libelle="Présentation" valeur={article?.presentationLibelle || article?.presentationCode} />
        {d.notes && <ChampFiche libelle="Notes" valeur={d.notes} large />}
      </BandeFiche>
      <OngletAutres fiche={fiche} />
    </>
  );
}

/** Pages du classeur d'en-tête du dossier : les cartes de l'ancienne fiche (montants, dates, traçabilité) et les onglets OMRAN. */
export default function ClasseurEnteteDossier({
  dossier: d,
  fiche,
  montants,
}: Readonly<{ dossier: DossierDetailDto; fiche: ApiState<DossierFicheDto>; montants: ApiState<MontantsDossierDto> }>) {
  const e = fiche.data?.enTete;
  const onglets: OngletEntete[] = [
    { id: 'montants', titre: 'Montants', contenu: <Montants montants={montants} probabilite={d.probabiliteFinalisation ?? undefined} /> },
    { id: 'tarification', titre: 'Tarification HT / TTC', contenu: <Tarification e={e} /> },
    {
      id: 'autres-montants',
      titre: 'Autres montants',
      contenu: (
        <>
          <BandeFiche className="p-3 pb-0">
            <ChampFiche libelle="Mode de paiement" valeur={d.modePaie} />
          </BandeFiche>
          <OngletAutresMontants fiche={fiche} />
        </>
      ),
    },
    { id: 'jalons', titre: 'Statut et jalons', contenu: <StatutEtJalons d={d} fiche={fiche.data} /> },
    { id: 'dates', titre: 'Dates', contenu: <OngletDates fiche={fiche} /> },
    { id: 'dates-autres', titre: 'Dates autres', contenu: <OngletDatesAutres fiche={fiche} /> },
    { id: 'annulation', titre: 'Annulation / Résiliation', contenu: <OngletAnnulation fiche={fiche} dossierId={d.id} /> },
    {
      id: 'options',
      titre: 'Options du dossier',
      contenu: (
        <BandeFiche>
          <ChampFiche libelle="Quote-part" type="montant" valeur={typeof d.quotePart === 'number' ? formatPercent(d.quotePart, 2) : null} />
        </BandeFiche>
      ),
    },
    { id: 'autres', titre: 'Autres', contenu: <Autres d={d} fiche={fiche} /> },
    {
      id: 'tracabilite',
      titre: 'Traçabilité',
      contenu: (
        <BandeFiche>
          <ChampFiche libelle="Saisi par" valeur={d.creePar} />
          <ChampFiche libelle="Saisi le" valeur={formatDateTime(d.creeLe)} />
          <ChampFiche libelle="Modifié par" valeur={d.modifiePar} />
          <ChampFiche libelle="Modifié le" valeur={formatDateTime(d.modifieLe)} />
        </BandeFiche>
      ),
    },
  ];
  return <ClasseurEntete type="dossier" onglets={onglets} />;
}
