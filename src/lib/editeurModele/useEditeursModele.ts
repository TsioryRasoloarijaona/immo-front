import { useState } from 'react';
import { useEditor, type Editor } from '@tiptap/react';
import type { CatalogueChampsDto } from '../../types/modeles';
import { creerEtiqueteur, extensionsModele } from './commandes';

export type ZoneModele = 'corps' | 'enTete' | 'pied';

/** Ce qui a changé depuis le dernier enregistrement : seul un contenu ou une mise en page changés créent une version. */
export interface Modifications {
  contenu: boolean;
  miseEnPage: boolean;
  proprietes: boolean;
}

export const AUCUNE_MODIFICATION: Modifications = { contenu: false, miseEnPage: false, proprietes: false };

/** Trois éditeurs (corps, en-tête, pied) aux mêmes extensions ; la zone active reçoit les champs insérés. */
export function useEditeursModele(catalogue: CatalogueChampsDto, contenu: string, enTete: string, pied: string) {
  const [etiqueteur] = useState(() => ({ courant: creerEtiqueteur(catalogue) }));
  const [extensions] = useState(() => extensionsModele(etiqueteur));
  const [zone, setZone] = useState<ZoneModele>('corps');
  const [, setRevision] = useState(0);
  const [modifications, setModifications] = useState<Modifications>(AUCUNE_MODIFICATION);

  const relire = () => setRevision((r) => r + 1);

  function options(source: string, cible: ZoneModele, champ: keyof Modifications) {
    return {
      extensions,
      content: source,
      onFocus: () => setZone(cible),
      onSelectionUpdate: relire,
      onUpdate: () => {
        setModifications((m) => (m[champ] ? m : { ...m, [champ]: true }));
        relire();
      },
    };
  }

  const corps = useEditor(options(contenu, 'corps', 'contenu'));
  const editeurEnTete = useEditor(options(enTete, 'enTete', 'miseEnPage'));
  const editeurPied = useEditor(options(pied, 'pied', 'miseEnPage'));

  const parZone: Record<ZoneModele, Editor> = { corps, enTete: editeurEnTete, pied: editeurPied };

  return {
    corps,
    enTete: editeurEnTete,
    pied: editeurPied,
    actif: parZone[zone],
    modifications,
    marquer: (champ: keyof Modifications) => setModifications((m) => ({ ...m, [champ]: true })),
    reinitialiser: () => setModifications(AUCUNE_MODIFICATION),
  };
}
