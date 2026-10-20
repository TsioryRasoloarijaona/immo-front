import { useMemo, useState } from 'react';
import { Ruler, Search } from 'lucide-react';
import type { ColonneGrille } from '../../components/DataGrid';
import ListeAdmin from '../../components/entites/ListeAdmin';
import GardeEtudes from '../../components/faisabilite/GardeEtudes';
import { Badge } from '../../components/ui';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../components/ui/input-group';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { listEtudesFaisabilite } from '../../lib/apiFaisabilite';
import { toneStatut } from '../../lib/faisabilite';
import { formatSurface } from '../../lib/format';
import { referentielItems, useEntitesReferentiel } from '../../lib/referentiels';
import { useApi, useDebouncedValue } from '../../lib/useApi';
import type { EtudeFaisabiliteListeDto } from '../../types/faisabilite';

const TOUS = 'tous';

const COLONNES: ColonneGrille<EtudeFaisabiliteListeDto>[] = [
  { nom: 'code', libelle: 'Code', largeur: 14 },
  { nom: 'description', libelle: 'Description', largeur: 36 },
  { nom: 'dateDocument', libelle: 'Date', type: 'DATE', largeur: 12 },
  { nom: 'societeLibelle', libelle: 'Société', largeur: 22 },
  { nom: 'terrainLibelle', libelle: 'Terrain', largeur: 22 },
  {
    nom: 'statutLibelle', libelle: 'Statut', largeur: 16,
    rendu: (r) => (r.statutLibelle ? <Badge tone={toneStatut(r.statutCouleur)}>{r.statutLibelle}</Badge> : null),
  },
  { nom: 'bloquee', libelle: 'Bloquée', type: 'BOOLEEN', largeur: 9 },
  { nom: 'superficie', libelle: 'Superficie', type: 'NOMBRE', largeur: 13, rendu: (r) => formatSurface(r.superficie), formatValeur: (v) => formatSurface(Number(v)) },
  { nom: 'coutTotalTerrain', libelle: 'Coût total du terrain', type: 'MONTANT', largeur: 18 },
];

function Contenu() {
  const [search, setSearch] = useState('');
  const recherche = useDebouncedValue(search).trim();
  const [societeId, setSocieteId] = useState(TOUS);
  const [statutId, setStatutId] = useState(TOUS);
  const societes = useEntitesReferentiel();
  const etat = useApi(() => listEtudesFaisabilite({
    search: recherche || undefined,
    societeId: societeId === TOUS ? undefined : societeId,
    statutId: statutId === TOUS ? undefined : statutId,
  }), [recherche, societeId, statutId]);
  // Les statuts proposés viennent des études elles-mêmes : la liste non filtrée.
  const toutes = useApi(() => listEtudesFaisabilite(), []);
  const statuts = useMemo(() => {
    const parId = new Map<string, string>();
    for (const e of toutes.data ?? []) if (e.statutId && e.statutLibelle) parId.set(e.statutId, e.statutLibelle);
    return [...parId].map(([value, label]) => ({ label, value }));
  }, [toutes.data]);

  const choix = (items: { label: string; value: string }[], tous: string) => [{ label: tous, value: TOUS }, ...items];
  const itemsSocietes = choix(referentielItems(societes.data), 'Toutes les sociétés');
  const itemsStatuts = choix(statuts, 'Tous les statuts');

  return (
    <ListeAdmin
      titre="Études de faisabilité"
      icon={<Ruler />}
      chemin="/etudes-faisabilite"
      libelleNouveau="Nouvelle étude"
      etat={etat}
      colonnes={COLONNES}
      filtre={recherche !== '' || societeId !== TOUS || statutId !== TOUS}
      filtres={
        <>
          <InputGroup className="max-w-md">
            <InputGroupAddon><Search /></InputGroupAddon>
            <InputGroupInput placeholder="Rechercher un code, une description, un terrain…" value={search}
              onChange={(e) => setSearch(e.target.value)} />
          </InputGroup>
          <Select items={itemsSocietes} value={societeId} onValueChange={(v) => setSocieteId(v ?? TOUS)}>
            <SelectTrigger aria-label="Filtre Société" className="w-52"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {itemsSocietes.map((i) => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Select items={itemsStatuts} value={statutId} onValueChange={(v) => setStatutId(v ?? TOUS)}>
            <SelectTrigger aria-label="Filtre Statut" className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {itemsStatuts.map((i) => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
              </SelectGroup>
            </SelectContent>
          </Select>
        </>
      }
    />
  );
}

export default function EtudesFaisabiliteList() {
  return <GardeEtudes><Contenu /></GardeEtudes>;
}
