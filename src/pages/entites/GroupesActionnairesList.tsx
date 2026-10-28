import type { ColonneGrille } from '../../components/DataGrid';
import ListeAdmin from '../../components/entites/ListeAdmin';
import { listGroupesActionnaires } from '../../lib/apiEntites';
import { useApi } from '../../lib/useApi';
import type { GroupeActionnairesDto } from '../../types';

const COLONNES: ColonneGrille<GroupeActionnairesDto>[] = [
  { nom: 'code', libelle: 'Code', largeur: 15, classe: 'font-medium text-foreground' },
  { nom: 'description', libelle: 'Description', largeur: 50 },
  { nom: 'lignes', libelle: 'Actionnaires', type: 'NOMBRE', largeur: 15, valeur: (g) => g.lignes.length },
  { nom: 'creeLe', libelle: 'Crée le', type: 'DATE', largeur: 15, classe: 'text-muted-foreground' },
];

export default function GroupesActionnairesList() {
  const etat = useApi(listGroupesActionnaires, []);
  return <ListeAdmin titre="Groupes d'actionnaires" chemin="/groupes-actionnaires" sujet="groupe" aucun="Aucun groupe"
    libelleNouveau="Nouveau groupe" etat={etat} colonnes={COLONNES} />;
}
