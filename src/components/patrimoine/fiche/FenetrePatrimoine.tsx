import { useState, type ComponentProps, type ReactNode } from 'react';
import { ErrorState, LoadingState } from '../../ui';
import ClasseurBas from '../../fiche/ClasseurBas';
import ClasseurEntete, { type OngletEntete } from '../../fiche/ClasseurEntete';
import FenetreFiche from '../../fiche/FenetreFiche';
import PiedAudit from '../../fiche/PiedAudit';
import RubanFiche from '../../fiche/RubanFiche';
import { BandeFiche } from '../../fiche/ChampFiche';
import type { OngletFiche } from '../../FicheShell';
import type { VoisinsFiche } from '../../../lib/fenetreFiche';

type Corps = Readonly<{
  type: string;
  /** `aller(id)` ouvre un onglet du bas (Pièces jointes, Imprimer…). */
  ruban?: (aller: (onglet: string) => void) => ComponentProps<typeof RubanFiche>;
  /** Erreur d'une action du ruban (suppression refusée…). */
  erreur?: string | null;
  /** Messages d'information sous le ruban. */
  bandeaux?: ReactNode;
  bande?: ReactNode;
  entete?: OngletEntete[];
  bas?: OngletFiche[];
  /** Remplace le classeur du bas par un contenu qui porte déjà ses onglets (étude de faisabilité). */
  contenuBas?: ReactNode;
  ongletInitial?: string;
}>;

function CorpsFiche({ type, ruban, erreur, bandeaux, bande, entete, bas = [], contenuBas, ongletInitial }: Corps) {
  const [onglet, setOnglet] = useState(ongletInitial);
  const actif = bas.some((o) => o.id === onglet) ? (onglet ?? '') : (bas[0]?.id ?? '');
  const haut = bande || (entete && entete.length > 0);
  return (
    <>
      {ruban && <RubanFiche {...ruban(setOnglet)} />}
      {erreur && (
        <p role="alert" className="shrink-0 px-4 pt-2 text-label text-destructive">
          {erreur}
        </p>
      )}
      {bandeaux && <div className="shrink-0 px-4 pt-2">{bandeaux}</div>}
      {haut && (
        <div className="grid max-h-[52%] shrink-0 grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-4 overflow-auto border-b border-border px-4 py-3 empty:hidden">
          {bande && <BandeFiche>{bande}</BandeFiche>}
          {entete && entete.length > 0 && <ClasseurEntete type={type} onglets={entete} />}
        </div>
      )}
      {contenuBas ?? (
        <ClasseurBas actif={actif} onChange={setOnglet} onglets={bas.map((o) => ({ ...o, contenu: <div className="p-3">{o.contenu}</div> }))} />
      )}
    </>
  );
}

/**
 * Fenêtre de fiche du Patrimoine et de l'Administration : ruban, bande d'identité + classeur d'en-tête, classeur du bas.
 * Les états chargement / erreur / introuvable restent dans la fenêtre (elle s'ouvre toujours). `pret` : la fiche est
 * connue (une valeur en cache se repeint pendant la revalidation).
 */
export default function FenetrePatrimoine({
  nature,
  titre,
  badge,
  voisins,
  onFermer,
  trace,
  etat,
  ...corps
}: Readonly<{
  nature: string;
  titre: string;
  badge?: ReactNode;
  voisins?: VoisinsFiche;
  onFermer: () => void;
  trace?: ComponentProps<typeof PiedAudit>;
  etat: { chargement: boolean; erreur: string | null; pret: boolean; introuvable: string };
} & Corps>) {
  let contenu: ReactNode = <p className="p-4">{etat.introuvable}</p>;
  if (etat.erreur) contenu = <ErrorState message={etat.erreur} />;
  else if (etat.pret) contenu = <CorpsFiche {...corps} />;
  else if (etat.chargement) contenu = <LoadingState />;
  return (
    <FenetreFiche nature={nature} titre={titre} badge={badge} voisins={voisins} onFermer={onFermer} pied={trace && <PiedAudit {...trace} />}>
      {contenu}
    </FenetreFiche>
  );
}
