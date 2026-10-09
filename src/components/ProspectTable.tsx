import { useMemo } from 'react';
import DataGrid, { type ColonneGrille } from './DataGrid';
import { personDisplayName } from '../lib/domain';
import { poidsColonne } from '../lib/colonnes';
import { DISPOSITION_PROSPECTS } from '../lib/dispositions';
import type { ColonneDto, ProspectListItemDto } from '../types';

/** Pas de `RENDUS` ni `VALEURS` : l'écran suit le catalogue à la lettre — qui
 * coche « Prénom » doit voir la colonne prénom, pas une agrégation. */
const CLASSES: Record<string, string> = {
  code: 'text-muted-foreground',
  nom: 'font-medium text-foreground',
  prenom: 'font-medium text-foreground',
  raisonSociale: 'font-medium text-foreground',
  telephone: 'tabular-nums text-muted-foreground',
  mobile: 'tabular-nums text-muted-foreground',
  telephone1: 'tabular-nums text-muted-foreground',
  telephone2: 'tabular-nums text-muted-foreground',
  indicatifTelephone: 'tabular-nums text-muted-foreground',
  indicatifMobile: 'tabular-nums text-muted-foreground',
  fax: 'tabular-nums text-muted-foreground',
  cin: 'tabular-nums text-muted-foreground',
  ice: 'tabular-nums text-muted-foreground',
  codePostal: 'tabular-nums text-muted-foreground',
  email: 'text-muted-foreground',
  siteWeb: 'text-muted-foreground',
  ville: 'text-muted-foreground',
  type: 'text-muted-foreground',
  adresse: 'text-muted-foreground',
  adresse2: 'text-muted-foreground',
  adresse3: 'text-muted-foreground',
  pays: 'text-muted-foreground',
  paysResidence: 'text-muted-foreground',
  typeResidence: 'text-muted-foreground',
  dateNaissance: 'text-muted-foreground',
  lieuNaissance: 'text-muted-foreground',
  filsDe: 'text-muted-foreground',
  etDe: 'text-muted-foreground',
  nationalite: 'text-muted-foreground',
  situationFamiliale: 'text-muted-foreground',
  regimeMatrimonial: 'text-muted-foreground',
  kind: 'text-muted-foreground',
  titre: 'text-muted-foreground',
  sexe: 'text-muted-foreground',
  commercialNom: 'text-muted-foreground',
  employeur: 'text-muted-foreground',
  profession: 'text-muted-foreground',
  salaire: 'text-muted-foreground',
  creePar: 'text-muted-foreground',
  creeLe: 'text-muted-foreground',
  modifiePar: 'text-muted-foreground',
  modifieLe: 'text-muted-foreground',
};

const TITRES: Record<string, (r: ProspectListItemDto) => string | undefined> = {
  code: (r) => r.code || undefined,
  nom: (r) => r.nom || undefined,
  prenom: (r) => r.prenom || undefined,
  raisonSociale: (r) => r.raisonSociale || undefined,
  email: (r) => r.email || undefined,
  ville: (r) => r.ville || undefined,
  type: (r) => r.type || undefined,
  adresse: (r) => r.adresse || undefined,
  adresse2: (r) => r.adresse2 || undefined,
  adresse3: (r) => r.adresse3 || undefined,
  employeur: (r) => r.employeur || undefined,
  siteWeb: (r) => r.siteWeb || undefined,
  commercialNom: (r) => r.commercialNom || undefined,
  situationFamiliale: (r) => r.situationFamiliale || undefined,
  regimeMatrimonial: (r) => r.regimeMatrimonial || undefined,
  lieuNaissance: (r) => r.lieuNaissance || undefined,
  filsDe: (r) => r.filsDe || undefined,
  etDe: (r) => r.etDe || undefined,
};

export default function ProspectTable({
  rows,
  colonnes,
  onOuvrir,
  cleOrdre,
}: Readonly<{
  rows: ProspectListItemDto[];
  colonnes: ColonneDto[];
  onOuvrir: (id: string) => void;
  cleOrdre?: string;
}>) {
  const grille = useMemo<ColonneGrille<ProspectListItemDto>[]>(
    () =>
      colonnes.map((c) => ({
        nom: c.nom,
        libelle: c.libelle,
        type: c.type,
        largeur: poidsColonne(c.nom, DISPOSITION_PROSPECTS.poids),
        classe: CLASSES[c.nom],
        titre: TITRES[c.nom],
      })),
    [colonnes],
  );

  return (
    <DataGrid
      cleOrdre={cleOrdre}
      rows={rows}
      colonnes={grille}
      onOuvrir={onOuvrir}
      /* `prenom`/`nom`/`raisonSociale` sont décochables, donc absents de la charge
         utile : sans ce repli sur le code puis l'id, chaque ligne dirait « Sans nom ». */
      libelleLigne={(r) =>
        `Ouvrir la fiche de ${r.prenom || r.nom || r.raisonSociale ? personDisplayName(r) : r.code || r.id}`
      }
    />
  );
}
