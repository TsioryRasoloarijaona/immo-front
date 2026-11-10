import { useState, type ReactNode } from 'react';
import ClasseurBas from '../fiche/ClasseurBas';
import ClasseurEntete from '../fiche/ClasseurEntete';
import ChampFiche, { BandeFiche } from '../fiche/ChampFiche';
import FenetreFiche from '../fiche/FenetreFiche';
import PiedAudit from '../fiche/PiedAudit';
import { Badge, ErrorState, LoadingState } from '../ui';
import {
  HistoriqueDocumentAchat,
  LignesDocumentAchat,
  MontantsDocumentAchat,
  ReglementsDocumentAchat,
  VentilationDocumentAchat,
} from './ongletsDocumentAchat';
import { getDocumentAchat } from '../../lib/apiAchat';
import { intituleDocumentAchat, libelleStatutAchat, tonStatutAchat } from '../../lib/documentsAchat';
import { formatCurrency, formatDate } from '../../lib/format';
import { useApi } from '../../lib/useApi';
import type { VoisinsFiche } from '../../lib/fenetreFiche';
import type { DocumentAchatDetailDto } from '../../types/achat';

function CorpsDocument({ d }: Readonly<{ d: DocumentAchatDetailDto }>) {
  const [onglet, setOnglet] = useState('lignes');
  return (
    <>
      <div className="grid max-h-[52%] shrink-0 grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-4 overflow-auto border-b border-border px-4 py-3">
        <BandeFiche>
          <ChampFiche libelle="Entité" valeur={d.entiteDescription ?? d.entiteCode} />
          <ChampFiche libelle="Société" valeur={d.societeCode} />
          <ChampFiche libelle="Date pièce" valeur={formatDate(d.dateDocument)} />
          <ChampFiche libelle="Échéance" valeur={formatDate(d.dateEcheance)} />
          <ChampFiche libelle="Fournisseur" valeur={d.fournisseurNom} />
          <ChampFiche libelle="Référence" valeur={d.reference} />
          <ChampFiche libelle="Projet" valeur={d.projetCode} />
          <ChampFiche libelle="Lot" valeur={d.lotCode} />
          <ChampFiche libelle="Décompte" valeur={d.decompteCode} lien={d.decompteId ? `/projet/decomptes/${d.decompteId}` : undefined} />
          <ChampFiche libelle="Valide compta" valeur={d.valideComptabilite} type="case" />
          <ChampFiche libelle="Désignation" valeur={d.description} large />
          {d.notes && <ChampFiche libelle="Notes" valeur={d.notes} large />}
        </BandeFiche>
        <ClasseurEntete type="achat-document" onglets={[{ id: 'montants', titre: 'Montants', contenu: <MontantsDocumentAchat d={d} /> }]} />
      </div>
      <ClasseurBas
        actif={onglet}
        onChange={setOnglet}
        onglets={[
          { id: 'lignes', libelle: 'Lignes', compteur: d.lignes.length, contenu: <LignesDocumentAchat d={d} /> },
          { id: 'ventilation', libelle: 'Ventilation', compteur: d.ventilation.length, contenu: <VentilationDocumentAchat d={d} /> },
          { id: 'reglements', libelle: 'Règlements', compteur: d.reglements.length, contenu: <ReglementsDocumentAchat d={d} /> },
          { id: 'historique', libelle: 'Historique', compteur: d.historique.length, contenu: <HistoriqueDocumentAchat d={d} /> },
        ]}
      />
    </>
  );
}

/** Fiche d'une pièce d'achat en fenêtre flottante, en lecture seule. */
export default function FicheDocumentAchatFenetre({
  id,
  voisins,
  onFermer,
}: Readonly<{ id: string; voisins?: VoisinsFiche; onFermer: () => void }>) {
  const { data: d, loading, error } = useApi(() => getDocumentAchat(id), [id]);

  // Le 404 du back porte déjà « Pièce introuvable ».
  let corps: ReactNode = null;
  if (error) corps = <ErrorState message={error} />;
  else if (d) corps = <CorpsDocument d={d} />;
  else if (loading) corps = <LoadingState />;

  return (
    <FenetreFiche
      nature="Pièce d'achat"
      titre={d ? intituleDocumentAchat(d) || "Pièce d'achat" : "Pièce d'achat"}
      badge={
        d && (
          <>
            <Badge tone={tonStatutAchat(d)}>{libelleStatutAchat(d)}</Badge>
            {d.tropRegle && <Badge tone="amber">Trop réglé</Badge>}
            <span className="text-label font-semibold tabular-nums text-foreground">{formatCurrency(d.montantTTC)}</span>
          </>
        )
      }
      voisins={voisins}
      onFermer={onFermer}
      pied={d && <PiedAudit creePar={d.creePar} creeLe={d.dateCreation} modifiePar={d.modifiePar} modifieLe={d.dateModification} />}
    >
      {corps}
    </FenetreFiche>
  );
}
