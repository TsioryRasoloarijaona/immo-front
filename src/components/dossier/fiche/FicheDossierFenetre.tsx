import { useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowRightLeft, ArrowUpRight, BellDot, Phone } from 'lucide-react';
import { Badge, ErrorState, LoadingState } from '../../ui';
import ClasseurBas from '../../fiche/ClasseurBas';
import FenetreFiche from '../../fiche/FenetreFiche';
import PiedAudit from '../../fiche/PiedAudit';
import RubanFiche from '../../fiche/RubanFiche';
import ActionsFicheDossier from '../ActionsFicheDossier';
import BandeauxDossier from '../BandeauxDossier';
import { EditionEnTete } from '../FormulaireDossier';
import BandeDossier from './BandeDossier';
import MessageCreation from './MessageCreation';
import ongletsDossier, { type DonneesFicheDossier } from './ongletsDossier';
import ClasseurEnteteDossier from './ongletsEnteteDossier';
import useFicheDossier from './useFicheDossier';
import { canonicalStatusLabel, toneForStatus } from '../../../lib/dossierStatus';
import type { VoisinsFiche } from '../../../lib/fenetreFiche';
import { useToast } from '../../../lib/toastContext';
import { usePreview } from '../../../lib/previewContext';
import type { DossierDetailDto } from '../../../types';

const NATURE = 'Dossier de vente';

function CorpsDossier({
  f,
  d,
  onglet,
  onOnglet,
  fromCreation,
}: Readonly<{ f: DonneesFicheDossier; d: DossierDetailDto; onglet: string; onOnglet: (id: string) => void; fromCreation: boolean }>) {
  const showToast = useToast();
  const { ouvrirFicheProspection } = usePreview();
  const o = ongletsDossier(f, d, fromCreation);
  const prospectionId = d.prospectionId;
  const message = fromCreation && !f.echeances.error && f.echeances.data;

  return (
    <>
      <RubanFiche
        enregistrer={{ disabled: true, onClick: () => undefined, aide: 'Les champs se modifient par les boutons du ruban.' }}
        propres={[
          { id: 'statut', libelle: 'Changer le statut', icone: ArrowRightLeft, onClick: () => onOnglet('statut') },
          { id: 'appeler', libelle: 'Appeler', icone: Phone, onClick: () => showToast('Intégration VOIP à venir.') },
          ...(prospectionId
            ? [{ id: 'prospection', libelle: 'Ouvrir la prospection', icone: ArrowUpRight, onClick: () => ouvrirFicheProspection(prospectionId, false) }]
            : []),
        ]}
        enSuite={
          <>
            <EditionEnTete dossier={d} enTete={f.fiche.data?.enTete} enRuban />
            <ActionsFicheDossier dossierId={d.id} commercialNom={d.commercialNom} onChanged={() => void f.relireTout()} />
          </>
        }
        imprimer={{ onClick: () => onOnglet('documents') }}
        piecesJointes={{ onClick: () => onOnglet('pieces') }}
      />
      <div className="flex shrink-0 flex-col gap-1.5 px-4 pt-2 empty:hidden">
        <BandeauxDossier fiche={f.fiche.data} />
        {message && <MessageCreation vide={f.echeances.data?.totalElements === 0} />}
      </div>
      <div className="grid max-h-[52%] shrink-0 grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-4 overflow-auto border-b border-border px-4 py-3">
        <BandeDossier dossier={d} enTete={f.fiche.data?.enTete} />
        <ClasseurEnteteDossier dossier={d} fiche={f.fiche} montants={f.montants} />
      </div>
      <ClasseurBas
        actif={onglet}
        onChange={onOnglet}
        onglets={[o.financier, o.acquereurs, o.articles, o.modifications, o.cadeaux, o.statut, o.actions, o.pieces, o.documents, o.historique]}
      />
    </>
  );
}

function Titre({ d, sorti, instructionNonLue }: Readonly<{ d: DossierDetailDto; sorti: boolean; instructionNonLue: boolean }>) {
  return (
    <>
      <Badge tone={toneForStatus(d.statut)}>{canonicalStatusLabel(d.statut) || '—'}</Badge>
      {sorti && <Badge tone="warning">Dossier sorti</Badge>}
      {instructionNonLue && <BellDot aria-label="Instruction non lue" className="size-4 shrink-0 text-(--info)" />}
    </>
  );
}

/**
 * Fiche du dossier de vente en fenêtre flottante, au-dessus de la liste. `?onglet=financier` et `?nouveau=1`
 * (liens existants) restent compris ; sans eux, la fenêtre s'ouvre sur le schéma de financement.
 */
export default function FicheDossierFenetre({
  id,
  voisins,
  onFermer,
}: Readonly<{ id: string; voisins?: VoisinsFiche; onFermer: () => void }>) {
  const f = useFicheDossier(id);
  const [params] = useSearchParams();
  const fromCreation = params.get('nouveau') === '1';
  const [onglet, setOnglet] = useState('financier');
  const d = f.dossier.data;

  // `!d` : avec une valeur en cache, on repeint le dossier connu et la revalidation se fait en fond.
  let corps: ReactNode = <p className="p-4">Ce dossier n'existe pas.</p>;
  if (f.dossier.error) corps = <ErrorState message={f.dossier.error} />;
  else if (d) corps = <CorpsDossier f={f} d={d} onglet={onglet} onOnglet={setOnglet} fromCreation={fromCreation} />;
  else if (f.dossier.loading) corps = <LoadingState />;

  return (
    <FenetreFiche
      nature={NATURE}
      titre={d ? [d.code, d.clientNom].filter(Boolean).join(' · ') || 'Dossier' : 'Dossier'}
      badge={d && <Titre d={d} sorti={!!f.montants.data?.dossierSorti} instructionNonLue={!!f.fiche.data?.instructionNonLue} />}
      voisins={voisins}
      onFermer={onFermer}
      pied={d && <PiedAudit creePar={d.creePar} creeLe={d.creeLe} modifiePar={d.modifiePar} modifieLe={d.modifieLe} />}
    >
      {corps}
    </FenetreFiche>
  );
}
