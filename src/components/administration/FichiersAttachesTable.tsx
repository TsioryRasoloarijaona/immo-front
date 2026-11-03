import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import DataGrid, { type ColonneGrille } from '../DataGrid';
import { ouvrirFichierAttache } from '../../lib/apiAdministration';
import { lienObjet } from '../../lib/fichiersAttaches';
import { formatDateTime } from '../../lib/format';
import type { LigneFichierAttacheDto } from '../../types/administration';

function Ouvrir({ ligne }: Readonly<{ ligne: LigneFichierAttacheDto }>) {
  if (!ligne.avecFichier) return null;
  return (
    <button
      type="button"
      title="Ouvrir le fichier"
      aria-label={`Ouvrir ${ligne.description ?? 'le fichier'}`}
      className="inline-flex items-center text-muted-foreground hover:text-foreground"
      onClick={(e) => {
        e.stopPropagation();
        ouvrirFichierAttache(ligne.id);
      }}
    >
      <ExternalLink aria-hidden className="size-3.5" />
    </button>
  );
}

function ObjetRattache({ ligne }: Readonly<{ ligne: LigneFichierAttacheDto }>) {
  const lien = lienObjet(ligne);
  if (!lien) return <>{ligne.categorieLibelle}</>;
  return (
    <Link to={lien} className="text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
      {ligne.categorieLibelle ?? 'Ouvrir'}
    </Link>
  );
}

const ouiNon = (r: LigneFichierAttacheDto) => (r.avecFichier ? 'Oui' : 'Non');

const COLONNES: ColonneGrille<LigneFichierAttacheDto>[] = [
  { nom: 'ouvrir', libelle: 'Ouvrir', largeur: 3, valeur: ouiNon, rendu: (r) => <Ouvrir ligne={r} /> },
  { nom: 'categorieLibelle', libelle: 'Objet rattaché', largeur: 14, rendu: (r) => <ObjetRattache ligne={r} /> },
  { nom: 'description', libelle: 'Description', largeur: 14 },
  { nom: 'groupe', libelle: 'Groupe', largeur: 6 },
  { nom: 'extension', libelle: 'Extension', largeur: 4 },
  { nom: 'type', libelle: 'Type', largeur: 9 },
  { nom: 'avecFichier', libelle: 'Fichier associé', largeur: 5, valeur: ouiNon, rendu: ouiNon },
  { nom: 'creeLe', libelle: 'Créé le', largeur: 7, valeur: (r) => formatDateTime(r.creeLe), rendu: (r) => formatDateTime(r.creeLe) },
  { nom: 'creePar', libelle: 'Créé par', largeur: 7 },
  { nom: 'modifiePar', libelle: 'Modifié par', largeur: 7 },
  { nom: 'modifieLe', libelle: 'Modifié le', largeur: 7, valeur: (r) => formatDateTime(r.modifieLe), rendu: (r) => formatDateTime(r.modifieLe) },
];

export default function FichiersAttachesTable({ rows }: Readonly<{ rows: LigneFichierAttacheDto[] }>) {
  return <DataGrid rows={rows} colonnes={COLONNES} cleOrdre="admin-fichiers-attaches" libelleLigne={(r) => r.description ?? 'Fichier'} />;
}
