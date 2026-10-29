import { useRef, useState } from 'react';
import { Pencil, X } from 'lucide-react';
import ActionAdmin from '../../patrimoine/ActionAdmin';
import { SectionFiche } from '../../patrimoine/FicheSections';
import ChampsDe, { PageTrace } from '../../patrimoine/fiche/ChampsDe';
import FenetrePatrimoine from '../../patrimoine/fiche/FenetrePatrimoine';
import { useImprimer, useSuppression } from '../../patrimoine/fiche/outilsFiche';
import type { OngletFiche } from '../../FicheShell';
import { Saisie, type ConfigFiche, type Tracee } from '../FicheEditable';
import LignesActionnaires from '../LignesActionnaires';
import { fichePdf } from '../../../lib/apiFichesPdf';
import type { VoisinsFiche } from '../../../lib/fenetreFiche';
import { lignesDe, rangeesDepuis } from '../../../lib/lignesActionnaires';
import { refetchAllApis, useApi } from '../../../lib/useApi';

function onglets<T extends Tracee>(config: ConfigFiche<T>, fiche: T): OngletFiche[] {
  const lignes = config.lignes;
  return [
    ...config.sections.map((s) => ({ id: s.titre, libelle: s.titre, contenu: <SectionFiche section={s} source={fiche} /> })),
    ...(lignes
      ? [{
          id: 'repartition',
          libelle: 'Répartition',
          contenu: <LignesActionnaires titre={lignes.titre} champ={lignes.champ} rangees={rangeesDepuis(lignesDe(fiche, lignes.cle), lignes.champ)} />,
        }]
      : []),
    ...(config.onglets?.(fiche) ?? []),
  ];
}

/**
 * Fenêtre d'une fiche dont le détail est le formulaire (entité, actionnaire, groupe) : lecture à l'ouverture,
 * « Débloquer » / « Modifier » (Administrateur) héberge le formulaire existant, et « Enregistrer » du ruban l'envoie.
 */
export default function FicheEditableFenetre<T extends Tracee>({ id, config, nature, voisins, onFermer }: Readonly<{
  id: string;
  config: ConfigFiche<T>;
  nature: string;
  voisins?: VoisinsFiche;
  onFermer: () => void;
}>) {
  const { data: fiche, loading, error } =useApi(() => config.charger(id), [id]);
  const [edition, setEdition] = useState(false);
  const declencheur = useRef<(() => void) | null>(null);
  const ressource = config.ressourceFichePdf;
  const imprimer = useImprimer(() => (ressource ? fichePdf(ressource, id) : Promise.reject(new Error('Aucune fiche à imprimer.'))));
  const { erreur, supprimer } = useSuppression({ titre: 'Supprimer', message: config.messageSuppression, action: () => config.supprimer(id), apres: onFermer });
  // La liste sous la fenêtre reste montée : tout relire (code, description, filtre Actif).
  const recharger = refetchAllApis;
  const saisie = fiche && (
    <Saisie config={config} fiche={fiche} declencheurRef={declencheur} onAnnuler={() => setEdition(false)}
      onEnregistre={() => { setEdition(false); recharger(); }} />
  );

  let bas: OngletFiche[] = [];
  if (fiche) bas = edition ? [{ id: 'saisie', libelle: 'Saisie', contenu: saisie }] : onglets(config, fiche);

  return (
    <FenetrePatrimoine
      type={config.chemin.slice(1)}
      nature={nature}
      titre={fiche?.description || fiche?.code || config.libelleListe}
      badge={fiche?.code}
      voisins={voisins}
      onFermer={onFermer}
      enEdition={edition}
      trace={fiche ?? undefined}
      etat={{ chargement: loading && !fiche, erreur: error, pret: !!fiche, introuvable: 'Cet enregistrement n\'existe pas.' }}
      erreur={erreur}
      ruban={() => ({
        enregistrer: edition ? { onClick: () => declencheur.current?.() } : undefined,
        propres: edition ? [{ id: 'annuler', libelle: 'Annuler', icone: X, onClick: () => setEdition(false) }] : [],
        enSuite: !edition && fiche && (
          <>
            {config.actions?.(fiche, recharger)}
            <ActionAdmin onClick={() => setEdition(true)} libelle={config.libelleEdition} variant="outline" icone={<Pencil data-icon="inline-start" />} />
          </>
        ),
        imprimer: ressource && !edition ? imprimer : undefined,
        supprimer: edition ? undefined : supprimer,
      })}
      bande={fiche && <ChampsDe sections={config.sections.slice(0, 1)} source={fiche} />}
      entete={fiche ? [{ id: 'trace', titre: 'Traçabilité', contenu: <PageTrace source={fiche} /> }] : undefined}
      bas={bas}
    />
  );
}
