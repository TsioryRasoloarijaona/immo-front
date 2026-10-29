import { useState, type ReactNode } from 'react';
import { Pencil } from 'lucide-react';
import LienFiche from '../../LienFiche';
import Modal from '../../Modal';
import ClasseurBas from '../../fiche/ClasseurBas';
import ClasseurEntete from '../../fiche/ClasseurEntete';
import ChampFiche, { BandeFiche } from '../../fiche/ChampFiche';
import FenetreFiche from '../../fiche/FenetreFiche';
import PiedAudit from '../../fiche/PiedAudit';
import RubanFiche from '../../fiche/RubanFiche';
import DevisFormSection from '../../DevisFormSection';
import FicheOffreActions from '../../offres/FicheOffreActions';
import BoutonDossierOffre from '../../offres/BoutonDossierOffre';
import { Badge, EmptyState, ErrorState, LoadingState } from '../../ui';
import { BarreOffre, SchemaOffre, SousArticles, TracabiliteOffre } from './ongletsOffre';
import { ApiError, getOffre, modifierOffre, supprimerOffre } from '../../../lib/api';
import { useApi, refetchAllApis } from '../../../lib/useApi';
import { useConfirm } from '../../../lib/confirmContext';
import { detailOffre, modificationOffre, valeursEditionOffre } from '../../../lib/offres';
import { formatCurrency, formatDate, formatSurface } from '../../../lib/format';
import type { VoisinsFiche } from '../../../lib/fenetreFiche';
import type { CreerDevisRequest, FicheDevisDto } from '../../../types';

/** 404 → `null` : « Offre introuvable » plutôt qu'une erreur (inconnue ou hors périmètre, indiscernables). */
async function lireOffre(id: string): Promise<FicheDevisDto | null> {
  try {
    return await getOffre(id);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

function BandeOffre({ fiche }: Readonly<{ fiche: FicheDevisDto }>) {
  const o = fiche.offre;
  const prospection = o.prospectionId ? (
    <LienFiche cible={{ type: 'prospection', id: o.prospectionId, pre: false }} className="truncate text-(--info) hover:underline">
      {o.prospectionCode}
    </LienFiche>
  ) : (
    o.prospectionCode
  );
  return (
    <BandeFiche>
      <ChampFiche libelle="Code" valeur={o.code} />
      <ChampFiche libelle="Date" valeur={formatDate(o.dateDocument)} />
      <ChampFiche libelle="Prospect" valeur={o.prospect} />
      <ChampFiche libelle="Commercial" valeur={o.commercial} />
      <ChampFiche libelle="Tranche" valeur={o.trancheDescription || o.tranche} />
      <ChampFiche libelle="Article" valeur={[o.article, o.articleDescription].filter(Boolean).join(' — ')} />
      <ChampFiche libelle="Catégorie" valeur={o.articleCategorie} />
      <ChampFiche libelle="Type" valeur={o.articleType} />
      <ChampFiche libelle="Superficie" valeur={o.articleSuperficie == null ? undefined : formatSurface(o.articleSuperficie)} />
      <ChampFiche libelle="Prospection" valeur={prospection} />
      <ChampFiche libelle="Mode de paiement" valeur={o.modePaiement} />
      {o.notes && <ChampFiche libelle="Notes" valeur={o.notes} large />}
    </BandeFiche>
  );
}

function CorpsOffre({ fiche, onFermer, relire }: Readonly<{ fiche: FicheDevisDto; onFermer: () => void; relire: () => void }>) {
  const confirm = useConfirm();
  const [onglet, setOnglet] = useState('sous-articles');
  const [edition, setEdition] = useState(false);
  const [erreurSuppression, setErreurSuppression] = useState<string | null>(null);
  const o = fiche.offre;

  async function supprimer() {
    const ok = await confirm({
      title: 'Supprimer l’offre',
      message: `Supprimer l'offre ${o.code ?? ''} ? Ses sous-articles et son schéma de financement seront supprimés aussi.`,
      confirmLabel: 'Supprimer',
      cancelLabel: 'Revenir',
    });
    if (!ok) return;
    setErreurSuppression(null);
    try {
      await supprimerOffre(o.id);
      refetchAllApis();
      onFermer();
    } catch (err) {
      setErreurSuppression(err instanceof Error ? err.message : 'Échec de la suppression.');
    }
  }

  async function enregistrer(saisie: CreerDevisRequest) {
    await modifierOffre(o.id, modificationOffre(fiche, saisie));
    setEdition(false);
    relire();
    refetchAllApis();
  }

  return (
    <>
      <RubanFiche
        enregistrer={{ disabled: true, onClick: () => undefined, aide: 'Les champs se modifient par le bouton Modifier.' }}
        propres={[{ id: 'modifier', libelle: 'Modifier', icone: Pencil, onClick: () => setEdition(true) }]}
        enSuite={
          <>
            <BoutonDossierOffre fiche={fiche} />
            <FicheOffreActions offre={o} compact={false} />
          </>
        }
        // Laissé actif sur une offre liée : le 409 du serveur, qui nomme le dossier, fait foi.
        supprimer={{ onClick: () => void supprimer() }}
      />
      <div className="flex shrink-0 flex-col gap-1.5 px-4 pt-2 empty:hidden">
        <BarreOffre fiche={fiche} erreur={erreurSuppression} />
      </div>
      <div className="grid max-h-[52%] shrink-0 grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-4 overflow-auto border-b border-border px-4 py-3">
        <BandeOffre fiche={fiche} />
        <ClasseurEntete
          type="offre"
          onglets={[
            { id: 'details', titre: 'Détails de l’offre', contenu: detailOffre(o) },
            { id: 'tracabilite', titre: 'Traçabilité', contenu: <TracabiliteOffre fiche={fiche} /> },
          ]}
        />
      </div>
      <ClasseurBas
        actif={onglet}
        onChange={setOnglet}
        onglets={[
          { id: 'sous-articles', libelle: 'Sous-articles', compteur: fiche.sousArticles.length, contenu: <SousArticles fiche={fiche} /> },
          { id: 'schema', libelle: 'Schéma de financement', compteur: o.schemaFinancement?.length ?? 0, contenu: <SchemaOffre fiche={fiche} /> },
        ]}
      />
      {edition && (
        <Modal title={`Modifier l'offre ${o.code ?? ''}`.trim()} onClose={() => setEdition(false)} width={760}>
          <DevisFormSection
            bare
            defaultTrancheId={o.trancheId}
            defaultArticleId={o.articleId}
            edition={valeursEditionOffre(fiche)}
            onAdd={enregistrer}
          />
        </Modal>
      )}
    </>
  );
}

/** Fiche de l'offre en fenêtre flottante, au-dessus de la liste. */
export default function FicheOffreFenetre({
  id,
  voisins,
  onFermer,
}: Readonly<{ id: string; voisins?: VoisinsFiche; onFermer: () => void }>) {
  const { data: fiche, loading, error, refetch } = useApi(() => lireOffre(id), [id]);
  const o = fiche?.offre;

  let corps: ReactNode = <EmptyState title="Offre introuvable" message="Cette offre n'existe pas ou n'est pas dans votre périmètre." />;
  if (error) corps = <ErrorState message={error} />;
  else if (fiche) corps = <CorpsOffre fiche={fiche} onFermer={onFermer} relire={() => void refetch()} />;
  else if (loading) corps = <LoadingState />;

  return (
    <FenetreFiche
      nature="Offre"
      titre={o ? [o.code, o.prospect].filter(Boolean).join(' · ') || 'Offre' : 'Offre'}
      badge={
        o && (
          <>
            {o.tranche && <Badge tone="neutral">{o.trancheDescription || o.tranche}</Badge>}
            <span className="text-label font-semibold tabular-nums text-foreground">{formatCurrency(o.montants?.prixVenteTTC)}</span>
          </>
        )
      }
      voisins={voisins}
      onFermer={onFermer}
      pied={o && <PiedAudit creePar={o.creePar} creeLe={o.creeLe} modifiePar={o.modifiePar} modifieLe={o.modifieLe} />}
    >
      {corps}
    </FenetreFiche>
  );
}
