import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Grid2x2, Pencil, Printer, Trash2 } from 'lucide-react';
import CadreFiche from '../../components/CadreFiche';
import FicheShell, { type OngletFiche } from '../../components/FicheShell';
import ActionAdmin from '../../components/patrimoine/ActionAdmin';
import ChampsSpecifiques from '../../components/patrimoine/ChampsSpecifiques';
import { SectionFiche } from '../../components/patrimoine/FicheSections';
import GrilleOnglet from '../../components/patrimoine/GrilleOnglet';
import PiecesJointesBloc from '../../components/patrimoine/PiecesJointesBloc';
import { Badge, ErrorState, Field, FieldGrid, LoadingState } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { ouvrirBlobDansOnglet } from '../../lib/api';
import { deleteLotissement, ficheLotissementPdf, getLotissement } from '../../lib/apiLotissements';
import { useConfirm } from '../../lib/confirmContext';
import { formatCurrency, formatPercent, formatSurface, libelleTrace } from '../../lib/format';
import { grilleContenances, sourceContenances } from '../../lib/ongletsArticle';
import { ongletsTransverses } from '../../lib/ongletsTransverses';
import { useContenances } from '../../lib/referentiels';
import { SECTIONS_LOT } from '../../lib/saisieLotissement';
import { useToast } from '../../lib/toastContext';
import { errorMessage, useApi } from '../../lib/useApi';
import type { LotissementDetailDto } from '../../types/lotissements';

const [IDENTITE, VALORISATION, FONCIER, AUTRES, URBANISME, COMPTEURS, ANOMALIE] = SECTIONS_LOT;

const paire = (ht?: number | null, ttc?: number | null) => `${formatCurrency(ht)} / ${formatCurrency(ttc)}`;

export default function LotissementDetail() {
  const { id = '' } = useParams();
  return <FicheLotissement key={id} id={id} />;
}

function SuperficiesLot({ lot: l }: Readonly<{ lot: LotissementDetailDto }>) {
  return (
    <div className="flex flex-col gap-4">
      <SectionFiche section={IDENTITE} source={l} />
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
        <Field label="Créé par" value={libelleTrace(l.creePar, l.creeLe)} />
        <Field label="Modifié par" value={libelleTrace(l.modifiePar, l.modifieLe)} />
      </FieldGrid>
      <SectionFiche section={VALORISATION} source={l} />
    </div>
  );
}

function ActionsLot({ lot, onSupprimer }: Readonly<{ lot: LotissementDetailDto; onSupprimer: () => void }>) {
  const showToast = useToast();
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" size="sm" variant="outline"
        onClick={() => void ouvrirBlobDansOnglet(() => ficheLotissementPdf(lot.id)).catch((err: unknown) => showToast({ texte: errorMessage(err), variante: 'erreur' }))}>
        <Printer data-icon="inline-start" /> Imprimer
      </Button>
      <ActionAdmin onClick={onSupprimer} libelle="Supprimer" variant="outline" icone={<Trash2 data-icon="inline-start" />} />
      <ActionAdmin to={`/lotissements/${lot.id}/modifier`} libelle="Modifier" variant="outline" icone={<Pencil data-icon="inline-start" />} />
    </div>
  );
}

function FicheLotissement({ id }: Readonly<{ id: string }>) {
  const { data: l, loading, error } = useApi(() => getLotissement(id), [id]);
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [onglet, setOnglet] = useState('superficies');
  const [erreurSuppression, setErreurSuppression] = useState<string | null>(null);
  const contenances = useContenances();

  async function supprimer() {
    const oui = await confirm({
      title: 'Supprimer le lotissement',
      message: 'Voulez-vous vraiment supprimer cet enregistrement ?',
      confirmLabel: 'Supprimer',
    });
    if (!oui) return;
    try {
      await deleteLotissement(id);
      void navigate('/lotissements');
    } catch (err) {
      setErreurSuppression(errorMessage(err));
    }
  }

  if (loading && !l) return <CadreFiche title="Lotissement"><LoadingState /></CadreFiche>;
  if (error) return <CadreFiche title="Lotissement"><ErrorState message={error} /></CadreFiche>;
  if (!l) {
    return (
      <CadreFiche title="Lotissement introuvable" crumbs={[{ label: 'Lotissements', to: '/lotissements' }]}>
        <p>Ce lotissement n'existe pas.</p>
      </CadreFiche>
    );
  }

  const code = l.code || 'Lotissement';
  const onglets: OngletFiche[] = [
    { id: 'superficies', libelle: 'Superficies / Valorisation', contenu: <SuperficiesLot lot={l} /> },
    { id: 'foncier', libelle: FONCIER.titre, contenu: <SectionFiche section={FONCIER} source={l} /> },
    {
      id: 'autres',
      libelle: 'Autres',
      contenu: (
        <div className="flex flex-col gap-4">
          {[AUTRES, URBANISME, COMPTEURS].map((s) => <SectionFiche key={s.titre} section={s} source={l} />)}
        </div>
      ),
    },
    {
      id: 'contenances',
      libelle: 'Contenances',
      contenu: (
        <>
          {contenances.error && <ErrorState message={contenances.error} />}
          <GrilleOnglet source={sourceContenances(l.id, l.presentationTypeId ?? undefined)} nouvelle={{ nombre: 1 }}
            {...grilleContenances(contenances.data)} />
        </>
      ),
    },
    { id: 'anomalie', libelle: ANOMALIE.titre, contenu: <SectionFiche section={ANOMALIE} source={l} /> },
    { id: 'pieces', libelle: 'Pièces jointes', contenu: <PiecesJointesBloc porteur="articles" id={l.id} /> },
    { id: 'champs', libelle: 'Champs spécifiques', contenu: <ChampsSpecifiques porteur="lotissement" id={l.id} /> },
    ...ongletsTransverses('article', l.id),
  ];

  return (
    <CadreFiche
      title={code}
      typeFiche="Lotissement"
      crumbs={[{ label: 'Patrimoine' }, { label: 'Lotissements', to: '/lotissements' }, { label: code }]}
      icon={<Grid2x2 />}
      fullHeight
      accent="var(--sec-tranche)"
      accentBg="var(--sec-tranche-bg)"
      actions={<ActionsLot lot={l} onSupprimer={() => void supprimer()} />}
    >
      <FicheShell
        ongletActif={onglet}
        onOngletChange={setOnglet}
        rembourrer
        identite={
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft data-icon="inline-start" /> Retour
            </Button>
            <h2 className="text-title font-semibold tracking-tight text-foreground">{l.code}</h2>
            <Badge tone={l.estOccupe ? 'neutral' : 'success'}>{l.estOccupe ? 'Occupé' : 'Libre'}</Badge>
            {erreurSuppression && <span role="alert" className="text-label text-destructive">{erreurSuppression}</span>}
          </div>
        }
        onglets={onglets}
      />
    </CadreFiche>
  );
}
