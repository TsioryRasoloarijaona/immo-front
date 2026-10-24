import { useMemo, useState } from 'react';
import { Landmark, Search } from 'lucide-react';
import BoutonExporter from '../../components/BoutonExporter';
import ColumnSelector from '../../components/ColumnSelector';
import ListeAdmin from '../../components/entites/ListeAdmin';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../components/ui/input-group';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { listEntitesJuridiques } from '../../lib/apiEntites';
import { colonneLocale as colonne, grilleDepuisCatalogue, useColonnesVisibles, type DispositionColonnes } from '../../lib/colonnes';
import { useApi, useDebouncedValue } from '../../lib/useApi';
import type { ColonneDto, EntiteJuridiqueDto } from '../../types';

/** Tableau Liste de la page ENTITES JURIDIQUE de l'aide OMRAN ; le choix des colonnes est local. */
const CATALOGUE: ColonneDto[] = [
  colonne('code', 'Code', 'GENERAL', 'TEXTE', true),
  colonne('description', 'Description', 'GENERAL', 'TEXTE', true),
  colonne('isActive', 'Active', 'GENERAL', 'BOOLEEN', true),
  colonne('identifiantFiscal', 'Matricule fiscale', 'GENERAL', 'TEXTE', true),
  colonne('registreCommerce', 'Registre de commerce', 'GENERAL', 'TEXTE', true),
  colonne('ville', 'Ville', 'COORDONNEES', 'TEXTE', true),
  colonne('formeJuridique', 'Forme juridique', 'GENERAL'),
  colonne('deviseCode', 'Devise', 'GENERAL'),
  colonne('dateCreation', 'Date de création', 'GENERAL', 'DATE'),
  colonne('capital', 'Capital', 'GENERAL', 'MONTANT'),
  colonne('cnss', 'CNSS', 'GENERAL'),
  colonne('patente', 'Patente', 'GENERAL'),
  colonne('ice', "Identifiant commun de l'entreprise", 'GENERAL'),
  colonne('dateLiquidation', 'Date liquidation', 'GENERAL', 'DATE'),
  colonne('partMaison', 'Part maison', 'GENERAL', 'NOMBRE'),
  colonne('groupeActionnairesLibelle', 'Groupe actionnaire', 'AUTRES'),
  colonne('nombreActionnaires', 'Nombre actionnaires', 'AUTRES', 'NOMBRE'),
  colonne('nombreParts', 'Nombre de parts (actions)', 'AUTRES', 'NOMBRE'),
  colonne('adresse', 'Adresse', 'COORDONNEES'),
  colonne('adresse2', 'Adresse 2', 'COORDONNEES'),
  colonne('adresse3', 'Adresse 3', 'COORDONNEES'),
  colonne('codePostal', 'Code postal', 'COORDONNEES'),
  colonne('paysLibelle', 'Pays', 'COORDONNEES'),
  colonne('telephone', 'Tél.', 'COORDONNEES'),
  colonne('mobile', 'Mobile', 'COORDONNEES'),
  colonne('fax', 'Fax', 'COORDONNEES'),
  colonne('email', 'Email', 'COORDONNEES'),
  colonne('siteWeb', 'Site web', 'COORDONNEES'),
  colonne('villeSignature', 'Courrier fait à', 'PROGRAMME'),
  colonne('representantLegalLibelle', 'Représentant légal', 'PROGRAMME'),
  colonne('signataireLibelle', 'Courrier signataire', 'PROGRAMME'),
  colonne('responsableCommercialLibelle', 'Responsable commercial', 'PROGRAMME'),
  colonne('responsableTechniqueLibelle', 'Responsable technique', 'PROGRAMME'),
  colonne('descriptionLongue', 'Description détaillée', 'AUTRES'),
  colonne('creePar', 'Crée par', 'AUDIT'),
  colonne('creeLe', 'Crée le', 'AUDIT', 'DATE'),
  colonne('modifiePar', 'Modifié par', 'AUDIT'),
  colonne('modifieLe', 'Modifié le', 'AUDIT', 'DATE'),
];

const DISPOSITION: DispositionColonnes = {
  ordre: CATALOGUE.map((c) => c.nom),
  poids: { description: 40, code: 14, isActive: 8, ville: 16 },
};

const FILTRES_ACTIF = [
  { label: 'Toutes', value: 'tous' },
  { label: 'Actives', value: 'true' },
  { label: 'Inactives', value: 'false' },
] as const;

type FiltreActif = (typeof FILTRES_ACTIF)[number]['value'];

export default function EntitesJuridiquesList() {
  const [search, setSearch] = useState('');
  const recherche = useDebouncedValue(search).trim();
  const [actif, setActif] = useState<FiltreActif>('tous');
  const etat = useApi(() => listEntitesJuridiques(actif, recherche || undefined), [actif, recherche]);
  const colonnes = useColonnesVisibles('entites-juridiques', CATALOGUE, DISPOSITION);
  const grille = useMemo(
    () => grilleDepuisCatalogue<EntiteJuridiqueDto>(colonnes.colonnes, DISPOSITION.poids, 'description'),
    [colonnes.colonnes],
  );

  return (
    <ListeAdmin
      titre="Entités juridiques"
      icon={<Landmark />}
      chemin="/entites-juridiques"
      libelleNouveau="Nouvelle entité"
      etat={etat}
      colonnes={grille}
      filtre={recherche !== '' || actif !== 'tous'}
      filtres={
        <>
          <InputGroup className="max-w-md">
            <InputGroupAddon><Search /></InputGroupAddon>
            <InputGroupInput placeholder="Rechercher un code, une description, un matricule fiscal, un RC…" value={search}
              onChange={(e) => setSearch(e.target.value)} />
          </InputGroup>
          <Select items={[...FILTRES_ACTIF]} value={actif} onValueChange={(v) => setActif(v ?? 'tous')}>
            <SelectTrigger aria-label="Filtre Active" className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {FILTRES_ACTIF.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
              </SelectGroup>
            </SelectContent>
          </Select>
        </>
      }
      outils={
        <div className="flex items-center gap-2">
          <BoutonExporter pdf chemin="/api/entites-juridiques/export" nomListe="entites-juridiques"
            params={{ actif, search: recherche || undefined, colonnes: colonnes.visibles }} />
          <ColumnSelector catalogue={colonnes.catalogueServi} visibles={colonnes.visibles} onBasculer={colonnes.basculer}
            onReinitialiser={colonnes.reinitialiser} estDefaut={colonnes.estDefaut} />
        </div>
      }
    />
  );
}
