import type { ColonneGrille } from '../../components/DataGrid';
import ListeAdmin from '../../components/entites/ListeAdmin';
import { FicheActionnaireFenetre } from '../../components/entites/fiche/fichesEntites';
import { listActionnaires } from '../../lib/apiEntites';
import { useApi } from '../../lib/useApi';
import type { ActionnaireDto } from '../../types';

const COLONNES: ColonneGrille<ActionnaireDto>[] = [
  { nom: 'code', libelle: 'Code', largeur: 15, classe: 'font-medium text-foreground' },
  { nom: 'description', libelle: 'Description', largeur: 35 },
  { nom: 'notes', libelle: 'Notes', largeur: 35, classe: 'text-muted-foreground' },
  { nom: 'creeLe', libelle: 'Crée le', type: 'DATE', largeur: 15, classe: 'text-muted-foreground' },
];

export default function ActionnairesList() {
  const etat = useApi(listActionnaires, []);
  return <ListeAdmin titre="Actionnaires" chemin="/actionnaires" libelleNouveau="Nouvel actionnaire" sujet="actionnaire" aucun="Aucun actionnaire"
    etat={etat} colonnes={COLONNES} Fiche={FicheActionnaireFenetre} />;
}
