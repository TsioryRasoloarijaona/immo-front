import { useState, type ReactNode } from 'react';
import { Printer } from 'lucide-react';
import BarreIcones from '../BarreIcones';
import ClasseurBas from '../fiche/ClasseurBas';
import ClasseurEntete from '../fiche/ClasseurEntete';
import ChampFiche, { BandeFiche } from '../fiche/ChampFiche';
import FenetreFiche from '../fiche/FenetreFiche';
import PiedAudit from '../fiche/PiedAudit';
import { Badge, EmptyState, ErrorState, LoadingState } from '../ui';
import { Button } from '../ui/button';
import BarreActionsPieceAchat from './BarreActionsPieceAchat';
import BlocRetenuesAvances from './BlocRetenuesAvances';
import {
  HistoriqueDocumentAchat,
  LignesDocumentAchat,
  MontantsDocumentAchat,
  ReglementsDocumentAchat,
  VentilationDocumentAchat,
} from './ongletsDocumentAchat';
import { AvoirsAchat, LienPiece, PiecesLieesAchat } from './ongletsLiensAchat';
import { ApiError } from '../../lib/api';
import { getDocumentAchat } from '../../lib/apiAchat';
import { intituleDocumentAchat, libelleStatutAchat, tonStatutAchat } from '../../lib/documentsAchat';
import { ongletsPieceAchat, type OngletPieceAchat } from '../../lib/fichePieceAchat';
import { formatCurrency, formatDate } from '../../lib/format';
import { useApi } from '../../lib/useApi';
import type { VoisinsFiche } from '../../lib/fenetreFiche';
import type { UUID } from '../../types';
import type { DocumentAchatDetailDto } from '../../types/achat';

type Ouvrir = (id: UUID) => void;

function EnteteDocument({ d, onOuvrir }: Readonly<{ d: DocumentAchatDetailDto; onOuvrir: Ouvrir }>) {
  const lien = (id: UUID | null, code: string | null) => (id ? <LienPiece id={id} code={code} onOuvrir={onOuvrir} /> : code);
  return (
    <BandeFiche>
      <ChampFiche libelle="Entité" valeur={d.entiteDescription ?? d.entiteCode} />
      <ChampFiche libelle="Société" valeur={d.societeCode} />
      <ChampFiche libelle="Module" valeur={d.moduleLibelle} />
      <ChampFiche libelle="Type" valeur={d.typeLotLibelle} />
      <ChampFiche libelle="Date pièce" valeur={formatDate(d.dateDocument)} />
      <ChampFiche libelle="Échéance" valeur={formatDate(d.dateEcheance)} />
      <ChampFiche libelle="Fournisseur" valeur={d.fournisseurNom} />
      <ChampFiche libelle="Pers. à contacter" valeur={d.personneAContacter} />
      <ChampFiche libelle="Référence" valeur={d.reference} />
      <ChampFiche libelle="Dos. groupement" valeur={d.dossierGroupement} />
      <ChampFiche libelle="Projet" valeur={d.projetCode} />
      <ChampFiche libelle="Lot" valeur={d.lotCode} lien={d.lotId ? `/projet/lots/${d.lotId}` : undefined} />
      <ChampFiche libelle="Déclencheur" valeur={d.declencheurNom} />
      <ChampFiche libelle="Réf. bureau ordre" valeur={d.referenceBureauOrdre} />
      <ChampFiche libelle="Décompte" valeur={d.decompteCode} lien={d.decompteId ? `/projet/decomptes/${d.decompteId}` : undefined} />
      {d.nature === 'ORDER' && <ChampFiche libelle="Livraison souh." valeur={formatDate(d.dateLivraisonSouhaitee)} />}
      <ChampFiche libelle="Devise" valeur={d.deviseCode} />
      <ChampFiche libelle="Valide compta" valeur={d.valideComptabilite} type="case" />
      {d.nature === 'QUOTE' && <ChampFiche libelle="Devis sélectionné" valeur={d.devisSelectionne} type="case" />}
      {d.devisOrigineCode && <ChampFiche libelle="Devis d'origine" valeur={lien(d.devisOrigineId, d.devisOrigineCode)} />}
      {d.bonCommandeCode && <ChampFiche libelle="Bon de commande" valeur={lien(d.bonCommandeId, d.bonCommandeCode)} />}
      {d.factureSourceCode && <ChampFiche libelle="Facture source" valeur={lien(d.factureSourceId, d.factureSourceCode)} />}
      <ChampFiche libelle="Catégories" valeur={d.categories} large />
      <ChampFiche libelle="Désignation" valeur={d.description} large />
      <ChampFiche libelle="Note" valeur={d.notes} large />
      <ChampFiche libelle="Note 2" valeur={d.note2} large />
    </BandeFiche>
  );
}

function ongletBas(id: OngletPieceAchat, d: DocumentAchatDetailDto, onOuvrir: Ouvrir) {
  switch (id) {
    case 'lignes':
      return { libelle: 'Lignes', compteur: d.lignes.length, contenu: <LignesDocumentAchat d={d} /> };
    case 'ventilation':
      return { libelle: 'Ventilation', compteur: d.ventilation.length + d.ventilationProjets.length, contenu: <VentilationDocumentAchat d={d} /> };
    case 'bonsLivraison':
      return { libelle: 'Bons de livraison', compteur: d.bonsLivraison.length, contenu: <PiecesLieesAchat pieces={d.bonsLivraison} onOuvrir={onOuvrir} /> };
    case 'factures':
      return { libelle: 'Factures', compteur: d.factures.length, contenu: <PiecesLieesAchat pieces={d.factures} onOuvrir={onOuvrir} /> };
    case 'reglements':
      return { libelle: 'Règlements', compteur: d.reglements.length, contenu: <ReglementsDocumentAchat d={d} /> };
    case 'avoirs':
      return { libelle: 'Avoirs', compteur: d.avoirs.reduce((n, a) => n + a.lignes.length, 0), contenu: <AvoirsAchat avoirs={d.avoirs} onOuvrir={onOuvrir} /> };
    case 'historique':
      return { libelle: 'Historique', compteur: d.historique.length, contenu: <HistoriqueDocumentAchat d={d} /> };
  }
}

function CorpsDocument({ d, onOuvrir, onChange, onFermer }: Readonly<{
  d: DocumentAchatDetailDto;
  onOuvrir: Ouvrir;
  onChange: (piece: DocumentAchatDetailDto) => void;
  onFermer: () => void;
}>) {
  const [onglet, setOnglet] = useState('lignes');
  const onglets = ongletsPieceAchat(d.nature).map((id) => ({ id, ...ongletBas(id, d, onOuvrir) }));
  return (
    <>
      <BarreIcones className="flex shrink-0 items-center gap-1 border-b border-border px-3 py-1">
        <BarreActionsPieceAchat piece={d} onChange={onChange} onFermer={onFermer} />
        <Button type="button" variant="ghost" size="sm" disabled>
          <Printer /> Imprimer
        </Button>
      </BarreIcones>
      <div className="grid max-h-[52%] shrink-0 grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-4 overflow-auto border-b border-border px-4 py-3">
        <EnteteDocument d={d} onOuvrir={onOuvrir} />
        <ClasseurEntete
          type="achat-document"
          onglets={[
            {
              id: 'montants',
              titre: 'Montants',
              contenu: (
                <div className="grid grid-cols-2 gap-4">
                  <MontantsDocumentAchat d={d} />
                  <BlocRetenuesAvances r={d.retenuesAvances} />
                </div>
              ),
            },
          ]}
        />
      </div>
      <ClasseurBas actif={onglet} onChange={setOnglet} onglets={onglets} />
    </>
  );
}

/** Une pièce hors périmètre répond 404 : état « introuvable », pas une erreur générique. */
async function chargerPiece(id: UUID): Promise<DocumentAchatDetailDto | null> {
  try {
    return await getDocumentAchat(id);
  } catch (err: unknown) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

/** Fiche d'une pièce d'achat en fenêtre flottante, en lecture seule ; un lien vers une pièce liée l'ouvre dans la même fenêtre. */
export default function FicheDocumentAchatFenetre({
  id,
  voisins,
  onFermer,
}: Readonly<{ id: string; voisins?: VoisinsFiche; onFermer: () => void }>) {
  const [courant, setCourant] = useState(id);
  const { data: lue, loading, error } = useApi(() => chargerPiece(courant), [courant]);
  const [remplacee, setRemplacee] = useState<DocumentAchatDetailDto | null>(null);
  const d = remplacee?.id === courant ? remplacee : lue;

  let corps: ReactNode;
  if (error) corps = <ErrorState message={error} />;
  else if (loading && d?.id !== courant) corps = <LoadingState />;
  else if (d) corps = <CorpsDocument key={d.id} d={d} onOuvrir={setCourant} onChange={setRemplacee} onFermer={onFermer} />;
  else corps = <EmptyState title="Pièce introuvable" message="Cette pièce n'existe pas ou n'est pas accessible avec votre périmètre." />;

  return (
    <FenetreFiche
      nature="Pièce d'achat"
      titre={d ? intituleDocumentAchat(d) || "Pièce d'achat" : "Pièce d'achat"}
      badge={
        d && (
          <>
            <Badge tone={tonStatutAchat(d)}>{libelleStatutAchat(d)}</Badge>
            {d.tropRegle && <Badge tone="amber">Trop réglé</Badge>}
            {d.aDeduire && <Badge tone="amber">Avance à déduire</Badge>}
            <span className="text-label font-semibold tabular-nums text-foreground">{formatCurrency(d.montantTTC)}</span>
          </>
        )
      }
      voisins={courant === id ? voisins : undefined}
      onFermer={onFermer}
      pied={d && <PiedAudit creePar={d.creePar} creeLe={d.dateCreation} modifiePar={d.modifiePar} modifieLe={d.dateModification} />}
    >
      {corps}
    </FenetreFiche>
  );
}
