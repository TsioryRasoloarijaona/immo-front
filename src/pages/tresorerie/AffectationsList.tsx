import { useState } from 'react';
import DataGrid, { type ColonneGrille } from '../../components/DataGrid';
import EtatReglement from '../../components/tresorerie/EtatReglement';
import FicheDecaissementFenetre, { LibellePiece } from '../../components/tresorerie/FicheDecaissementFenetre';
import PageTresorerie from '../../components/tresorerie/PageTresorerie';
import { getAffectations } from '../../lib/apiTresorerie';
import { voisinsDe } from '../../lib/fenetreFiche';
import { accesRefuse, libelleStatutTresorerie, useFiltresTresorerie } from '../../lib/tresorerie';
import { useApi } from '../../lib/useApi';
import type { AffectationLigneDto, ModuleTresorerie, SensTresorerie } from '../../types/tresorerie';

function colonnes(module: ModuleTresorerie): ColonneGrille<AffectationLigneDto>[] {
  return [
    { nom: 'code', libelle: 'N° règlement', largeur: 9, classe: 'font-medium text-foreground' },
    { nom: 'datePiece', libelle: 'Date pièce', type: 'DATE', largeur: 7 },
    { nom: 'echeance', libelle: 'Échéance', type: 'DATE', largeur: 7 },
    { nom: 'datePointage', libelle: 'Pointage', type: 'DATE', largeur: 7 },
    { nom: 'codeRecu', libelle: 'N° de reçu', largeur: 7 },
    {
      nom: 'statut',
      libelle: 'Statut',
      largeur: 9,
      valeur: (r) => libelleStatutTresorerie(r.statut, r.statutLibelle),
      rendu: (r) => <EtatReglement statut={r.statut} libelle={r.statutLibelle} />,
    },
    { nom: 'montantReglement', libelle: 'Montant règlement', type: 'MONTANT', largeur: 9 },
    { nom: 'tiers', libelle: 'Tiers', largeur: 11 },
    { nom: 'type', libelle: 'Type', largeur: 8 },
    { nom: 'banque', libelle: 'Banque', largeur: 8 },
    { nom: 'compte', libelle: 'Compte', largeur: 8 },
    { nom: 'societe', libelle: 'Société', largeur: 8 },
    { nom: 'projet', libelle: 'Projet', largeur: 8 },
    { nom: 'lot', libelle: 'Lot', largeur: 7 },
    { nom: 'article', libelle: 'Article', largeur: 7 },
    { nom: 'categorie', libelle: 'Catégorie', largeur: 8 },
    {
      nom: 'pieceLiee',
      libelle: 'Pièce liée',
      largeur: 11,
      valeur: (r) => [r.pieceLiee?.type, r.pieceLiee?.libelle].filter(Boolean).join(' · '),
      rendu: (r) => <LibellePiece piece={r.pieceLiee} module={module} />,
    },
    { nom: 'montantPiece', libelle: 'Montant pièce', type: 'MONTANT', largeur: 9 },
    { nom: 'montantAffecte', libelle: 'Montant affecté', type: 'MONTANT', largeur: 9 },
    { nom: 'dossierCode', libelle: 'Dossier', largeur: 8 },
    { nom: 'dossierStatut', libelle: 'Statut dossier', largeur: 8 },
  ];
}

const classeLigne = (r: AffectationLigneDto) => (r.statut === 'CANCELED' ? 'text-muted-foreground line-through' : undefined);

export default function AffectationsList({ module, sens }: Readonly<{ module: ModuleTresorerie; sens: SensTresorerie }>) {
  const [ouvert, setOuvert] = useState<string>();
  const filtres = useFiltresTresorerie(module);
  const liste = useApi(() => accesRefuse(getAffectations(sens, filtres.filtres)), [sens, JSON.stringify(filtres.filtres)]);
  const lignes = liste.data?.lignes ?? [];
  const totaux = liste.data?.totaux;
  const cle = `tresorerie-affectations-${sens}-${module}`;
  // Une ligne = une affectation ; la fiche s'ouvre sur son règlement.
  const parLigne = new Map(lignes.map((l) => [l.id, l.reglementId]));
  const reglements = [...new Set(lignes.map((l) => l.reglementId))];

  return (
    <PageTresorerie
      cle={cle}
      titre={sens === 'DEBIT' ? 'Affectations des dépenses' : 'Affectations des recettes'}
      unite="affectation"
      liste={liste}
      total={liste.data?.total}
      vide={lignes.length === 0}
      filtres={filtres}
      totaux={[
        { libelle: 'Montant affecté', valeur: totaux?.montantAffecte ?? 0 },
        { libelle: 'Montant règlements', valeur: totaux?.montantReglement ?? 0 },
        { libelle: 'Débit', valeur: totaux?.debit ?? 0, ton: 'debit' },
        { libelle: 'Crédit', valeur: totaux?.credit ?? 0, ton: 'credit' },
      ]}
      grille={<DataGrid rows={lignes} colonnes={colonnes(module)} cleOrdre={cle} classeLigne={classeLigne} onOuvrir={(id) => setOuvert(parLigne.get(id))} bandeauRegroupement={false} />}
      fiche={
        ouvert && (
          <FicheDecaissementFenetre
            key={ouvert}
            id={ouvert}
            module={module}
            voisins={voisinsDe(reglements, ouvert, setOuvert)}
            onFermer={() => setOuvert(undefined)}
          />
        )
      }
    />
  );
}
