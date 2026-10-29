import type { ReactNode } from 'react';
import ChampFiche, { BandeFiche } from '../../fiche/ChampFiche';
import { libelleTrace } from '../../../lib/format';
import { valeurFiche, type Choix, type SectionSaisie } from '../../../lib/saisiePatrimoine';

/** Champs d'un catalogue (`SECTIONS_*`) en lecture, dans la grille de la bande ; `noms` en choisit et ordonne quelques-uns. */
export default function ChampsDe({
  sections,
  source,
  listes = {},
  noms,
}: Readonly<{ sections: SectionSaisie[]; source: object; listes?: Record<string, Choix>; noms?: string[] }>) {
  const valeurs = source as Record<string, unknown>;
  const defs = sections.flatMap((s) => s.champs);
  const choisis = noms ? noms.flatMap((n) => defs.filter((d) => d.nom === n)) : defs;
  return (
    <>
      {choisis.map((def) =>
        def.type === 'booleen' ? (
          <ChampFiche key={def.nom} libelle={def.libelle} type="case" valeur={valeurs[def.nom] === true} />
        ) : (
          <ChampFiche
            key={def.nom}
            libelle={def.libelle}
            type={def.type === 'montant' ? 'montant' : 'texte'}
            large={def.type === 'texteLong'}
            valeur={valeurFiche(def, source, listes[def.liste ?? ''])}
          />
        ),
      )}
    </>
  );
}

/** Une page du classeur d'en-tête : les champs d'une ou plusieurs sections. */
export function PageChamps(props: Readonly<Parameters<typeof ChampsDe>[0] & { enPlus?: ReactNode }>) {
  const { enPlus, ...champs } = props;
  return (
    <BandeFiche>
      <ChampsDe {...champs} />
      {enPlus}
    </BandeFiche>
  );
}

/** Page « Traçabilité » du classeur d'en-tête ; `enPlus` ajoute des champs propres à l'écran. */
export function PageTrace({
  source,
  enPlus,
}: Readonly<{
  source: { creePar?: string | null; creeLe?: string | null; modifiePar?: string | null; modifieLe?: string | null };
  enPlus?: ReactNode;
}>) {
  return (
    <BandeFiche>
      {enPlus}
      <ChampFiche libelle="Créé par" valeur={libelleTrace(source.creePar, source.creeLe)} />
      <ChampFiche libelle="Modifié par" valeur={libelleTrace(source.modifiePar, source.modifieLe)} />
    </BandeFiche>
  );
}
