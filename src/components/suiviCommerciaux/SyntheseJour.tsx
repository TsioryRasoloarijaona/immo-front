import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui';
import { formatJourSemaine, formatNumber, formatPercent } from '../../lib/format';
import {
  TYPE_APPEL_ENTRANT,
  TYPE_APPEL_SORTANT,
  lignesSyntheseSuivi,
  type ChoixSyntheseSuivi,
  type LigneSyntheseSuiviAffichee,
} from '../../lib/suiviCommerciaux';
import { cn } from '../../lib/utils';
import type { LigneSyntheseSuiviDto, SyntheseSuiviCommerciauxDto } from '../../types';

type Compteur = Exclude<
  keyof LigneSyntheseSuiviDto,
  'commercialCle' | 'commercialNom' | 'jour' | 'atteint' | 'taux' | 'moyennePersonnesJointes' | 'personnesJointes'
>;

/** `filtre` absent : la liste ne sait pas isoler ce compteur (elle ne distingue pas visite de prospection et de
 * vente), la cellule n'est pas cliquable. */
const COLONNES: { nom: Compteur; libelle: string; filtre?: ChoixSyntheseSuivi }[] = [
  { nom: 'appelsPasses', libelle: 'Appels passés', filtre: { type: TYPE_APPEL_SORTANT } },
  { nom: 'appelsRecus', libelle: 'Appels reçus', filtre: { type: TYPE_APPEL_ENTRANT } },
  { nom: 'contactsJoints', libelle: 'Contacts joints', filtre: { joint: true } },
  { nom: 'visitesProspection', libelle: 'Visites prospection' },
  { nom: 'visitesVente', libelle: 'Visites vente' },
  { nom: 'visitesPrevues', libelle: 'Visites prévues' },
  { nom: 'visitesPrevuesNonConsignees', libelle: 'Prévues non consignées' },
];

function Nombre({ n, libelle, onChoisir }: Readonly<{ n: number; libelle: string; onChoisir?: () => void }>) {
  if (n === 0 || !onChoisir) return <span className={cn('tabular-nums', n === 0 && 'text-muted-foreground')}>{formatNumber(n)}</span>;
  return (
    <button
      type="button"
      onClick={onChoisir}
      aria-label={`Afficher dans la liste : ${libelle}`}
      title="Afficher ces interactions dans la liste"
      className="rounded px-1 tabular-nums hover:bg-muted hover:text-(--brand)"
    >
      {formatNumber(n)}
    </button>
  );
}

function Objectif({ l, objectif }: Readonly<{ l: LigneSyntheseSuiviAffichee; objectif: number }>) {
  if (l.ligne.atteint !== null) {
    return (
      <Badge tone={l.ligne.atteint ? 'success' : 'warning'}>
        {l.ligne.atteint ? 'Atteint' : 'Non atteint'} · {formatPercent(l.ligne.taux)}
      </Badge>
    );
  }
  if (l.ligne.moyennePersonnesJointes === null) return null;
  return (
    <span className="text-micro text-muted-foreground">
      moy. {formatNumber(l.ligne.moyennePersonnesJointes, 1)} / j · objectif {formatNumber(objectif)}
    </span>
  );
}

/** Commercial × jour ; un clic sur un nombre filtre la liste sur le commercial, le jour et le compteur. */
export default function SyntheseJour({
  synthese,
  plusieursJours,
  commercialIds,
  onChoisir,
}: Readonly<{
  synthese: SyntheseSuiviCommerciauxDto;
  plusieursJours: boolean;
  commercialIds: readonly string[];
  onChoisir: (choix: ChoixSyntheseSuivi) => void;
}>) {
  const clic = (l: LigneSyntheseSuiviAffichee, filtre: ChoixSyntheseSuivi | undefined) => {
    const choix = l.choix;
    return choix && filtre ? () => onChoisir({ ...choix, ...filtre }) : undefined;
  };
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Commercial</TableHead>
          <TableHead>Jour</TableHead>
          <TableHead className="text-right">Personnes jointes</TableHead>
          <TableHead>Objectif ({formatNumber(synthese.objectif)})</TableHead>
          {COLONNES.map((c) => (
            <TableHead key={c.nom} className="text-right">
              {c.libelle}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {lignesSyntheseSuivi(synthese, plusieursJours, commercialIds).map((l) => {
          const contexte = [l.commercial, l.jour ? formatJourSemaine(l.jour) : 'période'].join(' · ');
          return (
            <TableRow key={l.cle} className={cn(l.niveau === 'total' && 'bg-muted/50 font-medium')}>
              <TableCell>{l.commercial}</TableCell>
              <TableCell className="text-muted-foreground">{l.jour ? formatJourSemaine(l.jour) : 'Total'}</TableCell>
              <TableCell className="text-right">
                <Nombre
                  n={l.ligne.personnesJointes}
                  libelle={`${contexte}, personnes jointes`}
                  // Un total additionne des personnes distinctes par jour : la liste ne peut pas le rejouer.
                  onChoisir={clic(l, l.niveau === 'ligne' ? { joint: true } : undefined)}
                />
              </TableCell>
              <TableCell>
                <Objectif l={l} objectif={synthese.objectif} />
              </TableCell>
              {COLONNES.map((c) => (
                <TableCell key={c.nom} className="text-right">
                  <Nombre
                    n={l.ligne[c.nom]}
                    libelle={`${contexte}, ${c.libelle.toLowerCase()}`}
                    onChoisir={clic(l, c.filtre)}
                  />
                </TableCell>
              ))}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
