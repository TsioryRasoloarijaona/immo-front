import { useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import Modal from '../Modal';
import BarreIcones from '../BarreIcones';
import { Button } from '../ui/button';
import { Field, FieldLabel } from '../ui/field';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { oublierLecturesRecentes } from '../../lib/api';
import { createModeleSimulation, getReferentielsProjet, updateModeleSimulation } from '../../lib/apiProjet';
import { ajouterLigne, lignesDepuisDto, versLignesDto, type LigneModeleEditee } from '../../lib/modeleSimulation';
import { errorMessage, useApi } from '../../lib/useApi';
import { cn } from '../../lib/utils';
import type { UUID } from '../../types';
import type { ModeleSimulationSaisieDto } from '../../types/projet';
import GraphiqueModele from './sousfenetres/GraphiqueModele';

const CLASSE_SELECT =
  'h-8 w-full rounded-md border border-input bg-background px-2 text-body text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none';
const CHAMP = 'h-6 w-full min-w-0 rounded-sm border border-transparent bg-transparent px-1 text-right text-body hover:border-border focus:border-ring focus:outline-none';
const ENTETE = 'px-1 py-1 text-left text-micro font-medium text-muted-foreground';

const nombre = (v: string) => (v === '' ? null : Number(v));

type ChampLigne = 'temps' | 'avancement' | 'paiement';
const COLONNES: { champ: ChampLigne; libelle: string }[] = [
  { champ: 'temps', libelle: 'Temps %' },
  { champ: 'avancement', libelle: 'Avancement %' },
  { champ: 'paiement', libelle: 'Paiement %' },
];

/** Fiche d'un modèle de simulation : création (`id` absent) ou modification ; le texte d'un 400 est affiché tel quel. */
export default function FicheModeleSimulation({ id, modele, onClose, onEnregistre }: Readonly<{
  id?: UUID;
  modele: ModeleSimulationSaisieDto;
  onClose: () => void;
  onEnregistre: () => void;
}>) {
  const referentiels = useApi(getReferentielsProjet, [], 'projet-referentiels');
  const [code, setCode] = useState(modele.code ?? '');
  const [description, setDescription] = useState(modele.description ?? '');
  const [categorieId, setCategorieId] = useState<string>(modele.categorieId ?? '');
  const [lignes, setLignes] = useState<LigneModeleEditee[]>(() => lignesDepuisDto(modele.lignes));
  const [selection, setSelection] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const changer = (cle: string, champ: ChampLigne, valeur: number | null) =>
    setLignes(lignes.map((l) => (l.cle === cle ? { ...l, [champ]: valeur } : l)));

  async function enregistrer(e: React.SyntheticEvent) {
    e.preventDefault();
    const corps: ModeleSimulationSaisieDto = { code: code.trim(), description: description.trim(), categorieId: categorieId || null, lignes: versLignesDto(lignes) };
    setEnvoi(true);
    setErreur(null);
    try {
      await (id ? updateModeleSimulation(id, corps) : createModeleSimulation(corps));
      oublierLecturesRecentes();
      onEnregistre();
    } catch (err) {
      setErreur(errorMessage(err));
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <Modal title={id ? `Modèle de simulation ${modele.code ?? ''}` : 'Nouveau modèle de simulation'} onClose={onClose} width={720}>
      <form onSubmit={(e) => void enregistrer(e)} className="flex flex-col gap-3">
        <BarreIcones className="flex items-center gap-1">
          <Button type="submit" variant="ghost" size="sm" disabled={envoi}><Save /> Enregistrer</Button>
        </BarreIcones>
        <div className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel htmlFor="ms-code">Code *</FieldLabel>
            <Input id="ms-code" value={code} onChange={(e) => setCode(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="ms-cat">Catégorie</FieldLabel>
            <select id="ms-cat" className={CLASSE_SELECT} value={categorieId} onChange={(e) => setCategorieId(e.target.value)}>
              <option value="" />
              {referentiels.data?.categories.map((c) => <option key={c.id} value={c.id}>{c.description ?? c.code}</option>)}
            </select>
          </Field>
          <Field className="col-span-2">
            <FieldLabel htmlFor="ms-desc">Description *</FieldLabel>
            <Input id="ms-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
        </div>
        <Tabs defaultValue="lignes">
          <TabsList>
            <TabsTrigger value="lignes">Lignes</TabsTrigger>
            <TabsTrigger value="graphique">Graphique</TabsTrigger>
          </TabsList>
          <TabsContent value="lignes" className="flex flex-col gap-2 pt-2">
            <BarreIcones className="flex items-center gap-1">
              <Button type="button" variant="ghost" size="sm" onClick={() => setLignes(ajouterLigne(lignes))}><Plus /> Ajouter une ligne</Button>
              <Button type="button" variant="ghost" size="sm" disabled={!selection} onClick={() => { setLignes(lignes.filter((l) => l.cle !== selection)); setSelection(null); }}>
                <Trash2 /> Supprimer la ligne
              </Button>
            </BarreIcones>
            <div className="max-h-64 overflow-auto rounded-md border">
              <table className="w-full border-collapse text-body">
                <thead className="sticky top-0 bg-background">
                  <tr className="border-b">{COLONNES.map((c) => <th key={c.champ} className={ENTETE}>{c.libelle}</th>)}</tr>
                </thead>
                <tbody>
                  {lignes.length === 0 && <tr><td colSpan={3} className="px-2 py-3 text-center text-muted-foreground">Aucune ligne</td></tr>}
                  {lignes.map((l) => (
                    <tr key={l.cle} onClick={() => setSelection(l.cle)} className={cn('border-b last:border-b-0', selection === l.cle && 'bg-muted')}>
                      {COLONNES.map((c) => (
                        <td key={c.champ}>
                          <input type="number" step="any" min={0} max={100} aria-label={c.libelle} className={CHAMP} value={l[c.champ] ?? ''}
                            onChange={(e) => changer(l.cle, c.champ, nombre(e.target.value))} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
          <TabsContent value="graphique" className="pt-2">
            <GraphiqueModele lignes={versLignesDto(lignes)} />
          </TabsContent>
        </Tabs>
        {erreur && <p role="alert" className="text-body text-destructive">{erreur}</p>}
      </form>
    </Modal>
  );
}
