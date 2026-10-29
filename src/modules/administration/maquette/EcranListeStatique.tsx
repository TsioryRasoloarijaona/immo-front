import { useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Badge, EmptyState } from '../../../components/ui';
import DataGrid from '../../../components/DataGrid';
import PageListe from '../../../components/liste/PageListe';
import EnteteListe from '../../../components/liste/EnteteListe';
import PanneauFiltresCoches from '../../../components/liste/PanneauFiltresCoches';
import BoiteFiltre from '../../../components/liste/BoiteFiltre';
import BarreEtatListe from '../../../components/liste/BarreEtatListe';
import BarreOutilsFlottante from '../../../components/liste/BarreOutilsFlottante';
import { Button } from '../../../components/ui/button';
import { voisinsDe } from '../../../lib/fenetreFiche';
import { pluriel } from '../../../lib/format';
import { cleFiltresFermes, useBooleenMemorise } from '../../../lib/outilsListe';
import { puceSelection } from '../../../lib/pucesFiltres';
import FicheStatique from './FicheStatique';
import { useActionMaquette } from './useActionMaquette';
import type { ConfigEcran, Ligne } from './types';

type Filtres = Record<string, string[]>;

function valeursDistinctes(lignes: Ligne[], nom: string): { value: string; label: string }[] {
  return [...new Set(lignes.map((l) => String(l[nom] ?? '')).filter((v) => v !== ''))].sort((a, b) => a.localeCompare(b, 'fr')).map((v) => ({ value: v, label: v }));
}

function correspond(l: Ligne, filtres: Filtres, texte: string, debut: string, fin: string, colonneDate?: string): boolean {
  if (Object.entries(filtres).some(([nom, v]) => v.length > 0 && !v.includes(String(l[nom])))) return false;
  if (texte && !Object.values(l).some((v) => String(v).toLowerCase().includes(texte))) return false;
  if (!colonneDate) return true;
  const jour = String(l[colonneDate]).slice(0, 10);
  return (!debut || jour >= debut) && (!fin || jour <= fin);
}

/** Écran de liste statique entièrement décrit par sa configuration : filtres, grille, fiche en fenêtre, barre d'outils. */
export default function EcranListeStatique({ config, racine }: Readonly<{ config: ConfigEcran; racine: string }>) {
  const navigate = useNavigate();
  const { id: idOuvert } = useParams();
  const { search } = useLocation();
  const agir = useActionMaquette();
  const [fermes, basculer] = useBooleenMemorise(cleFiltresFermes(racine));
  const [texte, setTexte] = useState('');
  const [filtres, setFiltres] = useState<Filtres>({});
  const [periode, setPeriode] = useState({ debut: '', fin: '' });
  const [choisies, setChoisies] = useState<Set<string>>(new Set());

  const boites = useMemo(
    () => (config.filtres ?? []).map((nom) => ({ nom, titre: config.colonnes.find((c) => c.nom === nom)?.libelle ?? nom, items: valeursDistinctes(config.lignes, nom) })),
    [config],
  );
  const rows = config.lignes.filter((l) => correspond(l, filtres, texte.trim().toLowerCase(), periode.debut, periode.fin, config.colonneDate));
  const actif = texte !== '' || periode.debut !== '' || periode.fin !== '' || Object.values(filtres).some((v) => v.length > 0);
  const decompte = pluriel(rows.length, config.unite);
  const ouvrir = (id: string) => void navigate(`/administration/${racine}/${id}${search}`);
  const fermer = () => void navigate(`/administration/${racine}${search}`);
  const ligneOuverte = idOuvert === 'nouveau' ? ({ id: 'nouveau' } as Ligne) : rows.find((l) => l.id === idOuvert);
  const voisins = voisinsDe(rows.map((l) => l.id), idOuvert, ouvrir);

  function reinitialiser() {
    setTexte('');
    setFiltres({});
    setPeriode({ debut: '', fin: '' });
  }

  function basculerSelection(id: string) {
    setChoisies((prec) => {
      const suivant = new Set(prec);
      if (!suivant.delete(id)) suivant.add(id);
      return suivant;
    });
  }

  const puces = [
    ...(texte ? [`« ${texte} »`] : []),
    ...boites.flatMap((b) => puceSelection(b.titre, b.items, filtres[b.nom] ?? [])),
  ];
  const outil = (id: ConfigEcran['outils'][number]) => ({ id, onClick: () => agir(id === 'supprimer' ? 'Supprimer la sélection ?' : undefined) });
  const colonnes = config.colonnes;

  return (
    <PageListe titre={config.titre}>
      <EnteteListe titre={config.effectifDansTitre ? `${config.titre} (${rows.length})` : config.titre} lignes={decompte}>
        <Badge tone="amber">Maquette</Badge>
      </EnteteListe>
      <PanneauFiltresCoches
        ferme={fermes}
        onBasculer={basculer}
        puces={puces}
        periode={config.colonneDate ? { ...periode, onChange: (debut, fin) => setPeriode({ debut, fin }) } : undefined}
        recherche={{ valeur: texte, onChange: setTexte, placeholder: config.recherche }}
        onReinitialiser={reinitialiser}
      >
        {boites.map((b) => (
          <BoiteFiltre key={b.nom} titre={b.titre} items={b.items} mode="multiple" valeur={filtres[b.nom] ?? []} onChange={(v) => setFiltres({ ...filtres, [b.nom]: v })} />
        ))}
      </PanneauFiltresCoches>
      <div className="flex min-h-0 flex-1 flex-col gap-2 px-3 pt-2">
        {rows.length === 0 ? (
          <EmptyState
            title={actif ? 'Aucun résultat' : 'Rien à afficher'}
            message={actif ? 'Aucune ligne ne correspond aux filtres actifs.' : "Rien n'est encore enregistré ici."}
            action={actif ? <Button type="button" variant="outline" size="sm" onClick={reinitialiser}>Réinitialiser les filtres</Button> : undefined}
          />
        ) : (
          <div className="min-h-0 min-w-0 flex-1 overflow-auto rounded-xl border border-border bg-card">
            <DataGrid
              cleOrdre={`maquette-${racine}`}
              rows={rows}
              colonnes={colonnes}
              onOuvrir={ouvrir}
              libelleLigne={(l) => `Ouvrir la fiche : ${config.titreFiche(l)}`}
              selection={{ ids: choisies, onToggle: basculerSelection, onToggleAll: (ids) => setChoisies(new Set(ids.length === choisies.size ? [] : ids)) }}
              actions={config.actionLigne && ((l) => <ActionLigne config={config} ligne={l} />)}
            />
          </div>
        )}
      </div>
      {ligneOuverte && <FicheStatique key={idOuvert} config={config} ligne={ligneOuverte} voisins={voisins} onFermer={fermer} />}
      <BarreEtatListe lignes={decompte} selection={choisies.size === 0 ? 'aucune' : String(choisies.size)} />
      <BarreOutilsFlottante
        cle={`administration.${racine}`}
        ligneSelectionnee={choisies.size > 0}
        nouveau={config.outils.includes('nouveau') ? { libelle: 'Nouveau', onClick: () => void navigate(`/administration/${racine}/nouveau${search}`) } : undefined}
        actions={config.outils.filter((o) => o !== 'nouveau').map(outil)}
        propres={(config.propres ?? []).map((p) => ({ id: p.id, libelle: p.libelle, icone: p.icone, onClick: () => agir(p.confirmation) }))}
      />
    </PageListe>
  );
}

function ActionLigne({ config, ligne }: Readonly<{ config: ConfigEcran; ligne: Ligne }>) {
  const agir = useActionMaquette();
  const a = config.actionLigne;
  if (!a) return null;
  const Icone = a.icone;
  return (
    <button type="button" className="grid size-5 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground" title={a.libelle} aria-label={`${a.libelle} : ${config.titreFiche(ligne)}`} onClick={() => agir(a.confirmation)}>
      <Icone aria-hidden className="size-3.5" />
    </button>
  );
}
