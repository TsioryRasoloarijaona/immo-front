import { useNavigate, useParams } from 'react-router-dom';
import DataGrid, { type ColonneGrille } from '../../components/DataGrid';
import EtatReglement from '../../components/tresorerie/EtatReglement';
import FicheDecaissementFenetre from '../../components/tresorerie/FicheDecaissementFenetre';
import PageTresorerie from '../../components/tresorerie/PageTresorerie';
import { getDecaissements } from '../../lib/apiTresorerie';
import { voisinsDe } from '../../lib/fenetreFiche';
import { accesRefuse, libelleStatutTresorerie, useFiltresTresorerie } from '../../lib/tresorerie';
import { useApi } from '../../lib/useApi';
import type { DecaissementLigneDto, ModuleTresorerie } from '../../types/tresorerie';

const COLONNES: ColonneGrille<DecaissementLigneDto>[] = [
  { nom: 'code', libelle: 'N° règlement', largeur: 9, classe: 'font-medium text-foreground' },
  { nom: 'datePiece', libelle: 'Date pièce', type: 'DATE', largeur: 7 },
  { nom: 'echeance', libelle: 'Échéance', type: 'DATE', largeur: 7 },
  { nom: 'datePointage', libelle: 'Pointage', type: 'DATE', largeur: 7 },
  { nom: 'type', libelle: 'Type', largeur: 9 },
  { nom: 'tiers', libelle: 'Tiers', largeur: 12 },
  { nom: 'banque', libelle: 'Banque', largeur: 9 },
  { nom: 'compte', libelle: 'Compte', largeur: 9 },
  {
    nom: 'statut',
    libelle: 'Statut',
    largeur: 10,
    valeur: (r) => libelleStatutTresorerie(r.statut, r.statutLibelle),
    rendu: (r) => <EtatReglement statut={r.statut} libelle={r.statutLibelle} enRetard={r.enRetard} nonAffecte={r.nonAffecte} />,
  },
  { nom: 'montant', libelle: 'Montant', type: 'MONTANT', largeur: 9, valeurSomme: (r) => (r.statut === 'CANCELED' ? null : r.montant) },
  { nom: 'montantAffecte', libelle: 'Affecté', type: 'MONTANT', largeur: 9, valeurSomme: (r) => (r.statut === 'CANCELED' ? null : r.montantAffecte) },
  { nom: 'resteAAffecter', libelle: 'Reste à affecter', type: 'MONTANT', largeur: 9, valeurSomme: (r) => (r.statut === 'CANCELED' ? null : r.resteAAffecter) },
  { nom: 'societe', libelle: 'Société', largeur: 8 },
  { nom: 'comptabilise', libelle: 'Compta', type: 'BOOLEEN', largeur: 5 },
];

const classeLigne = (r: DecaissementLigneDto) => (r.statut === 'CANCELED' ? 'text-muted-foreground line-through' : undefined);

export default function DecaissementsList({ module }: Readonly<{ module: ModuleTresorerie }>) {
  const racine = module === 'PRJ' ? '/projet/depenses/decaissements' : '/achat/depenses/decaissements';
  const { id } = useParams();
  const navigate = useNavigate();
  const filtres = useFiltresTresorerie(module);
  const liste = useApi(() => accesRefuse(getDecaissements(filtres.filtres)), [JSON.stringify(filtres.filtres)]);
  const lignes = liste.data?.lignes ?? [];
  const totaux = liste.data?.totaux;
  const ouvrir = (cible: string) => void navigate(`${racine}/${cible}`);

  return (
    <PageTresorerie
      cle={`tresorerie-decaissements-${module}`}
      titre="Décaissements"
      unite="décaissement"
      liste={liste}
      total={liste.data?.total}
      vide={lignes.length === 0}
      filtres={filtres}
      totaux={[
        { libelle: 'Montant', valeur: totaux?.montant ?? 0 },
        { libelle: 'Affecté', valeur: totaux?.montantAffecte ?? 0 },
        { libelle: 'Reste à affecter', valeur: totaux?.resteAAffecter ?? 0 },
      ]}
      grille={<DataGrid rows={lignes} colonnes={COLONNES} cleOrdre={`tresorerie-decaissements-${module}`} classeLigne={classeLigne} onOuvrir={ouvrir} bandeauRegroupement={false} />}
      fiche={
        id && (
          <FicheDecaissementFenetre
            key={id}
            id={id}
            module={module}
            voisins={voisinsDe(lignes.map((l) => l.id), id, ouvrir)}
            onFermer={() => void navigate(racine)}
          />
        )
      }
    />
  );
}
