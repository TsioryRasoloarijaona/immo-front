import { sansAccents } from '../../lib/colonnes';
import { estChefOuExempte } from '../../lib/roles';
import { GUIDES_AIDE, THEMES_AIDE, type GuideAide } from './guides';

type Utilisateur = Parameters<typeof estChefOuExempte>[0];

/** Un tri d'affichage, pas une barrière : le contenu est public dans l'application. */
export function guidesVisibles(user: Utilisateur): GuideAide[] {
  const chef = estChefOuExempte(user);
  return GUIDES_AIDE.filter((g) => g.public === 'tous' || chef);
}

function texteDuGuide(g: GuideAide): string {
  return sansAccents([g.titre, g.resume, ...g.etapes, ...(g.bonASavoir ?? []), ...(g.attention ?? [])].join(' '));
}

/** Tous les mots saisis doivent figurer dans le guide, sans tenir compte des accents ni des majuscules. */
export function filtrerGuides(guides: readonly GuideAide[], recherche: string): GuideAide[] {
  const mots = sansAccents(recherche).split(/\s+/).filter(Boolean);
  if (mots.length === 0) return [...guides];
  return guides.filter((g) => {
    const texte = texteDuGuide(g);
    return mots.every((m) => texte.includes(m));
  });
}

export function sommaireParTheme(guides: readonly GuideAide[]): { titre: string; guides: GuideAide[] }[] {
  return THEMES_AIDE.map((t) => ({ titre: t.titre, guides: guides.filter((g) => g.theme === t.cle) })).filter(
    (s) => s.guides.length > 0,
  );
}

export function titreDuTheme(guide: GuideAide): string {
  return THEMES_AIDE.find((t) => t.cle === guide.theme)?.titre ?? '';
}
