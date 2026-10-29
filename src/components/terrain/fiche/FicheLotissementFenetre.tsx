import { Pencil } from 'lucide-react';
import ActionAdmin from '../../patrimoine/ActionAdmin';
import ChampsSpecifiques from '../../patrimoine/ChampsSpecifiques';
import { SectionFiche } from '../../patrimoine/FicheSections';
import GrilleOnglet from '../../patrimoine/GrilleOnglet';
import PiecesJointesBloc from '../../patrimoine/PiecesJointesBloc';
import ChampsDe, { PageTrace } from '../../patrimoine/fiche/ChampsDe';
import FenetrePatrimoine from '../../patrimoine/fiche/FenetrePatrimoine';
import { useImprimer, useSuppression } from '../../patrimoine/fiche/outilsFiche';
import { Badge, ErrorState, Field, FieldGrid } from '../../ui';
import type { OngletFiche } from '../../FicheShell';
import { deleteLotissement, ficheLotissementPdf, getLotissement } from '../../../lib/apiLotissements';
import type { VoisinsFiche } from '../../../lib/fenetreFiche';
import { formatCurrency, formatPercent, formatSurface } from '../../../lib/format';
import { grilleContenances, sourceContenances } from '../../../lib/ongletsArticle';
import { ongletsTransverses } from '../../../lib/ongletsTransverses';
import { useContenances } from '../../../lib/referentiels';
import { SECTIONS_LOT } from '../../../lib/saisieLotissement';
import { useApi } from '../../../lib/useApi';
import type { LotissementDetailDto } from '../../../types/lotissements';

const [IDENTITE, VALORISATION, FONCIER, AUTRES, URBANISME, COMPTEURS, ANOMALIE] = SECTIONS_LOT;

const paire = (ht?: number | null, ttc?: number | null) => `${formatCurrency(ht)} / ${formatCurrency(ttc)}`;

function SuperficiesLot({ lot: l }: Readonly<{ lot: LotissementDetailDto }>) {
  return (
    <div className="flex flex-col gap-4">
      <FieldGrid>
        <Field label="Surface provisoire" value={formatSurface(l.surfaceProvisoire)} />
        <Field label="Prix au m² provisoire HT / TTC" value={paire(l.prixM2ProvisoireHT, l.prixM2ProvisoireTTC)} />
        <Field label="Prix provisoire HT / TTC" value={paire(l.prixProvisoireHT, l.prixProvisoireTTC)} />
        <Field label="Surface définitive" value={formatSurface(l.surfaceDefinitive)} />
        <Field label="Prix au m² définitif HT / TTC" value={paire(l.prixM2DefinitifHT, l.prixM2DefinitifTTC)} />
        <Field label="Prix définitif HT / TTC" value={paire(l.prixDefinitifHT, l.prixDefinitifTTC)} />
        <Field label="TVA" value={formatPercent(l.tauxTva, 2)} />
        <Field label="Superficie nette" value={formatSurface(l.superficieNette)} />
        <Field label="Superficie titrée" value={formatSurface(l.superficieTitree)} />
      </FieldGrid>
      <SectionFiche section={VALORISATION} source={l} />
    </div>
  );
}

/** Fiche du lotissement en fenêtre flottante ; la saisie reste sur `/lotissements/:id/modifier`. */
export default function FicheLotissementFenetre({ id, voisins, onFermer }: Readonly<{ id: string; voisins?: VoisinsFiche; onFermer: () => void }>) {
  const { data: l, loading, error } = useApi(() => getLotissement(id), [id]);
  const contenances = useContenances();
  const imprimer = useImprimer(() => ficheLotissementPdf(id));
  const { erreur, supprimer } = useSuppression({
    titre: 'Supprimer le lotissement',
    message: 'Voulez-vous vraiment supprimer cet enregistrement ?',
    action: () => deleteLotissement(id),
    apres: onFermer,
  });

  function onglets(lot: LotissementDetailDto): OngletFiche[] {
    return [
      { id: 'superficies', libelle: 'Superficies / Valorisation', contenu: <SuperficiesLot lot={lot} /> },
      { id: 'foncier', libelle: FONCIER.titre, contenu: <SectionFiche section={FONCIER} source={lot} /> },
      {
        id: 'autres',
        libelle: 'Autres',
        contenu: (
          <div className="flex flex-col gap-4">
            {[AUTRES, URBANISME, COMPTEURS].map((s) => <SectionFiche key={s.titre} section={s} source={lot} />)}
          </div>
        ),
      },
      {
        id: 'contenances',
        libelle: 'Contenances',
        contenu: (
          <>
            {contenances.error && <ErrorState message={contenances.error} />}
            <GrilleOnglet source={sourceContenances(lot.id, lot.presentationTypeId ?? undefined)} nouvelle={{ nombre: 1 }} {...grilleContenances(contenances.data)} />
          </>
        ),
      },
      { id: 'anomalie', libelle: ANOMALIE.titre, contenu: <SectionFiche section={ANOMALIE} source={lot} /> },
      { id: 'pieces', libelle: 'Pièces jointes', contenu: <PiecesJointesBloc porteur="articles" id={lot.id} /> },
      { id: 'champs', libelle: 'Champs spécifiques', contenu: <ChampsSpecifiques porteur="lotissement" id={lot.id} /> },
      ...ongletsTransverses('article', lot.id),
    ];
  }

  return (
    <FenetrePatrimoine
      type="lotissement"
      nature="Lotissement"
      titre={l?.code || 'Lotissement'}
      badge={l && <Badge tone={l.estOccupe ? 'neutral' : 'success'}>{l.estOccupe ? 'Occupé' : 'Libre'}</Badge>}
      voisins={voisins}
      onFermer={onFermer}
      trace={l ?? undefined}
      etat={{ chargement: loading && !l, erreur: error, pret: !!l, introuvable: "Ce lotissement n'existe pas." }}
      erreur={erreur}
      ruban={(aller) => ({
        propres: [],
        enSuite: <ActionAdmin to={`/lotissements/${id}/modifier`} libelle="Modifier" variant="outline" icone={<Pencil data-icon="inline-start" />} />,
        imprimer,
        piecesJointes: { onClick: () => aller('pieces') },
        supprimer,
      })}
      bande={l && <ChampsDe sections={[IDENTITE]} source={l} />}
      entete={l ? [{ id: 'trace', titre: 'Traçabilité', contenu: <PageTrace source={l} /> }] : undefined}
      bas={l ? onglets(l) : []}
    />
  );
}
