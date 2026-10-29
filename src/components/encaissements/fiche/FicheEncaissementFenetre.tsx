import { useState, type ReactNode } from 'react';
import { Ban, ClipboardCheck } from 'lucide-react';
import ClasseurBas from '../../fiche/ClasseurBas';
import ClasseurEntete from '../../fiche/ClasseurEntete';
import ChampFiche, { BandeFiche } from '../../fiche/ChampFiche';
import FenetreFiche from '../../fiche/FenetreFiche';
import PiedAudit from '../../fiche/PiedAudit';
import RubanFiche from '../../fiche/RubanFiche';
import { PointerReglementModal, ReglementDocumentsJoints } from '../../ReglementPreuves';
import BoutonsRecu from '../BoutonsRecu';
import { Badge, EmptyState, ErrorState, LoadingState } from '../../ui';
import { AffectationsEncaissement, MontantsEncaissement, TracabiliteEncaissement } from './ongletsEncaissement';
import syntheseAffectations from './syntheseAffectations';
import { getEncaissement, modifierStatutReglement } from '../../../lib/api';
import { refetchAllApis, useApi } from '../../../lib/useApi';
import { useConfirm } from '../../../lib/confirmContext';
import { encaissementEtatLabel, encaissementEtatTone, reglementModifiable } from '../../../lib/domain';
import { messageErreurStatut } from '../../../lib/reglementRegles';
import { formatCurrency, formatDate } from '../../../lib/format';
import type { VoisinsFiche } from '../../../lib/fenetreFiche';
import type { EncaissementDetailDto } from '../../../types';

function intituleDe(e: EncaissementDetailDto): string {
  return [e.typeLibelle, e.banqueNom, e.reference ? `N° ${e.reference}` : null, e.dateDocument ? `du ${formatDate(e.dateDocument)}` : null]
    .filter(Boolean)
    .join(' ');
}

function BandeEncaissement({ e }: Readonly<{ e: EncaissementDetailDto }>) {
  return (
    <BandeFiche>
      <ChampFiche libelle="Entité" valeur={e.entiteLibelle} />
      <ChampFiche libelle="Date pièce" valeur={formatDate(e.dateDocument)} />
      <ChampFiche libelle="Échéance" valeur={formatDate(e.dateEcheance)} />
      <ChampFiche libelle="Type" valeur={e.typeLibelle} />
      <ChampFiche libelle="Référence" valeur={e.reference} />
      <ChampFiche libelle="Banque" valeur={e.banqueNom} />
      <ChampFiche libelle="Compte" valeur={e.compteCode} />
      <ChampFiche libelle="Dépôt" valeur={e.depotCode} />
      <ChampFiche libelle="Tiers réglant" valeur={e.tierNom} />
      {/* Le payeur peut différer du tiers du règlement : pas un doublon. */}
      <ChampFiche libelle="Versement effectué par" valeur={e.tierPayeurNom} />
      <ChampFiche libelle="N° de reçu" valeur={e.recuCode} />
      <ChampFiche libelle="Libellé" valeur={e.description} large />
      {e.notes && <ChampFiche libelle="Notes" valeur={e.notes} large />}
    </BandeFiche>
  );
}

function CorpsEncaissement({ e, relire }: Readonly<{ e: EncaissementDetailDto; relire: () => Promise<void> }>) {
  const confirm = useConfirm();
  const [onglet, setOnglet] = useState('affectations');
  const [pointageOuvert, setPointageOuvert] = useState(false);
  const [busy, setBusy] = useState(false);
  const [erreurStatut, setErreurStatut] = useState<string | null>(null);
  const { dossierRecu } = syntheseAffectations(e);
  const affectations = e.affectations ?? [];
  /* Portée des endpoints de preuve et de pointage (`/api/dossiers/{id}/reglements/…`) :
     le serveur accepte n'importe quel dossier des affectations. Le repli couvre
     un `dossierId` que le DTO déclare optionnel. */
  const dossierPortee = e.dossierId ?? affectations[0]?.dossierId;
  // Montée sur `IN_WORK` seulement : `POINTED` et `CANCELED` sont terminaux côté serveur (409).
  const enCours = reglementModifiable(e.etat) && !!dossierPortee;

  async function rechargerTout() {
    await relire();
    refetchAllApis();
  }

  async function annuler() {
    if (!dossierPortee) return;
    const ok = await confirm({
      title: 'Annuler le règlement',
      message: `Annuler définitivement ce règlement de ${formatCurrency(e.montantBrut)} ? Cet état est terminal : il ne pourra plus être pointé.`,
      confirmLabel: 'Annuler le règlement',
      cancelLabel: 'Revenir',
    });
    if (!ok) return;
    setBusy(true);
    setErreurStatut(null);
    try {
      await modifierStatutReglement(dossierPortee, e.id, { statut: 'CANCELED' });
      await rechargerTout();
    } catch (err) {
      setErreurStatut(messageErreurStatut(err));
    } finally {
      setBusy(false);
    }
  }

  const propres = enCours
    ? [
        { id: 'pointer', libelle: 'Pointer', icone: ClipboardCheck, disabled: busy, onClick: () => setPointageOuvert(true) },
        { id: 'annuler', libelle: 'Annuler le règlement', icone: Ban, disabled: busy, onClick: () => void annuler() },
      ]
    : [];

  return (
    <>
      <RubanFiche
        enregistrer={{ disabled: true, onClick: () => undefined, aide: 'Lecture seule : seul le statut se modifie, par le ruban.' }}
        propres={propres}
        enSuite={dossierRecu && <BoutonsRecu dossierId={dossierRecu} reglementId={e.id} reference={e.reference} />}
        piecesJointes={{ onClick: () => setOnglet('documents') }}
      />
      <div className="flex shrink-0 flex-col gap-1.5 px-4 pt-2 empty:hidden">
        {enCours && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border border-(--info-border) bg-(--info-bg) px-3 py-2">
            <span className="text-label font-medium text-foreground">Règlement en cours</span>
            <span className="min-w-0 text-micro text-muted-foreground">
              Le pointage constate l'encaissement. Il exige une date et au moins une preuve de paiement — déposez-la dans l'onglet « Documents joints ».
            </span>
            {erreurStatut && <span className="text-micro text-destructive">{erreurStatut}</span>}
          </div>
        )}
      </div>
      <div className="grid max-h-[52%] shrink-0 grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-4 overflow-auto border-b border-border px-4 py-3">
        <BandeEncaissement e={e} />
        <ClasseurEntete
          type="encaissement"
          onglets={[
            { id: 'montants', titre: 'Montants', contenu: <MontantsEncaissement e={e} /> },
            { id: 'tracabilite', titre: 'Traçabilité', contenu: <TracabiliteEncaissement e={e} /> },
          ]}
        />
      </div>
      <ClasseurBas
        actif={onglet}
        onChange={setOnglet}
        onglets={[
          { id: 'affectations', libelle: 'Affectations', compteur: affectations.length, contenu: <AffectationsEncaissement e={e} /> },
          {
            id: 'documents',
            libelle: 'Documents joints',
            contenu: dossierPortee ? (
              // Les preuves conditionnent le pointage : un dépôt doit débloquer le ruban sans recharger.
              <ReglementDocumentsJoints dossierId={dossierPortee} reglementId={e.id} statut={e.etat} onChanged={relire} />
            ) : (
              <EmptyState
                title="Preuves indisponibles"
                message="Les justificatifs sont rattachés au dossier portant l'échéance, et ce règlement n'en désigne aucun."
              />
            ),
          },
        ]}
      />
      {pointageOuvert && dossierPortee && (
        <PointerReglementModal
          dossierId={dossierPortee}
          /* `EncaissementDetailDto` et `ReglementDto` décrivent la même ligne `StlSettlement` sous d'autres noms. */
          reglement={{ id: e.id, montant: e.montantBrut, typeLibelle: e.typeLibelle, payeurNom: e.tierPayeurNom, societeId: e.entiteId }}
          onClose={() => setPointageOuvert(false)}
          onPointed={rechargerTout}
        />
      )}
    </>
  );
}

/** Fiche de l'encaissement en fenêtre flottante, au-dessus de la liste. */
export default function FicheEncaissementFenetre({
  id,
  voisins,
  onFermer,
}: Readonly<{ id: string; voisins?: VoisinsFiche; onFermer: () => void }>) {
  const { data: e, loading, error, refetch } = useApi(() => getEncaissement(id), [id]);

  let corps: ReactNode = <p className="p-4">Ce règlement n'existe pas.</p>;
  if (error) corps = <ErrorState message={error} />;
  else if (e) corps = <CorpsEncaissement e={e} relire={refetch} />;
  else if (loading) corps = <LoadingState />;

  return (
    <FenetreFiche
      nature="Encaissement"
      titre={e ? intituleDe(e) || e.reference || 'Règlement' : 'Encaissement'}
      badge={
        e && (
          <>
            <Badge tone={encaissementEtatTone(e.etat)}>{encaissementEtatLabel(e.etat)}</Badge>
            {/* Deux encodages du même fait, écrits ensemble par le serveur — pointer sans date est un 400. */}
            <span
              className="text-micro text-muted-foreground"
              title="Date d'encaissement effectif, écrite par le pointage. Vide tant que le règlement est en cours."
            >
              {e.dateReglement ? `pointé le ${formatDate(e.dateReglement)}` : 'non pointé'}
            </span>
            <Badge tone={e.comptabilise ? 'success' : 'neutral'}>{e.comptabilise ? 'Comptabilisé' : 'Non comptabilisé'}</Badge>
            {e.remisAuCentre && <Badge tone="info">Remis au centre</Badge>}
            <span className="text-label font-semibold tabular-nums text-foreground">{formatCurrency(e.montantBrut)}</span>
          </>
        )
      }
      voisins={voisins}
      onFermer={onFermer}
      pied={e && <PiedAudit creePar={e.creePar} creeLe={e.creeLe} modifiePar={e.modifiePar} modifieLe={e.modifieLe} />}
    >
      {corps}
    </FenetreFiche>
  );
}
