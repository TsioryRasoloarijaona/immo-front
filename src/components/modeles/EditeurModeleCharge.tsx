import { useState } from 'react';
import { EditorContent } from '@tiptap/react';
import { Eye, FileCode2, History, Save } from 'lucide-react';
import PageShell from '../PageShell';
import { Badge } from '../ui';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import BarreOutilsModele from './BarreOutilsModele';
import PanneauChamps from './PanneauChamps';
import PanneauMiseEnPage, { type FondDePage, type Marges, type Proprietes } from './PanneauMiseEnPage';
import ProprietesBlocPositionne from './ProprietesBlocPositionne';
import { DialogueCondition, DialogueRepetition } from './DialogueRegleModele';
import DialogueApercuModele from './DialogueApercuModele';
import DialogueHistoriqueModele from './DialogueHistoriqueModele';
import { modifierModele, ouvrirApercuModele, restaurerVersionModele, urlImageModele } from '../../lib/apiModeles';
import {
  appliquerCondition,
  appliquerRepetition,
  htmlOuNull,
  insererChamp,
  listeCourante,
  nettoyerHtmlModele,
  repeterPage,
} from '../../lib/editeurModele/commandes';
import { useEditeursModele } from '../../lib/editeurModele/useEditeursModele';
import { useConfirmationSortie } from '../../lib/useConfirmationSortie';
import { useToast } from '../../lib/toastContext';
import type { CatalogueChampsDto, MiseEnPageDto, ModeleDocumentDetailDto } from '../../types/modeles';

type Dialogue = 'condition' | 'repetition' | 'repetitionPage' | 'apercu' | 'historique' | null;

function margesDe(m: MiseEnPageDto): Marges {
  return { margeHaut: m.margeHaut ?? 15, margeBas: m.margeBas ?? 15, margeGauche: m.margeGauche ?? 15, margeDroite: m.margeDroite ?? 15 };
}

function fondDe(m: MiseEnPageDto): FondDePage {
  return { fondImageId: m.fondImageId ?? null, fondPleinePage: m.fondPleinePage ?? true };
}

/** Éditeur monté une fois le modèle et le catalogue chargés (FEATURE-modeles-documents.md §9). */
export default function EditeurModeleCharge({
  modele: initial,
  catalogue,
}: Readonly<{ modele: ModeleDocumentDetailDto; catalogue: CatalogueChampsDto }>) {
  const toast = useToast();
  const [modele, setModele] = useState(initial);
  const [marges, setMarges] = useState<Marges>(() => margesDe(initial.miseEnPage));
  const [fond, setFond] = useState<FondDePage>(() => fondDe(initial.miseEnPage));
  const [proprietes, setProprietes] = useState<Proprietes>({ libelle: initial.libelle, ordre: initial.ordre, actif: initial.actif });
  const [dialogue, setDialogue] = useState<Dialogue>(null);
  const [selectionVide, setSelectionVide] = useState(true);
  const [onglet, setOnglet] = useState<'champs' | 'page'>('champs');
  const [enregistrement, setEnregistrement] = useState(false);
  const ed = useEditeursModele(catalogue, initial.contenu, initial.miseEnPage.enTete ?? '', initial.miseEnPage.piedDePage ?? '');
  const modifie = ed.modifications.contenu || ed.modifications.miseEnPage || ed.modifications.proprietes;
  useConfirmationSortie(modifie);

  const actif = ed.actif;
  const listeActive = listeCourante(actif);

  function miseEnPage(): MiseEnPageDto {
    return {
      format: 'A4',
      ...marges,
      ...fond,
      enTete: htmlOuNull(ed.enTete.getHTML()),
      piedDePage: htmlOuNull(ed.pied.getHTML()),
    };
  }

  function contenu(): string {
    return nettoyerHtmlModele(ed.corps.getHTML());
  }

  function recharger(detail: ModeleDocumentDetailDto) {
    setModele(detail);
    setMarges(margesDe(detail.miseEnPage));
    setFond(fondDe(detail.miseEnPage));
    setProprietes({ libelle: detail.libelle, ordre: detail.ordre, actif: detail.actif });
    ed.corps.commands.setContent(detail.contenu, { emitUpdate: false });
    ed.enTete.commands.setContent(detail.miseEnPage.enTete ?? '', { emitUpdate: false });
    ed.pied.commands.setContent(detail.miseEnPage.piedDePage ?? '', { emitUpdate: false });
    ed.reinitialiser();
  }

  async function enregistrer() {
    setEnregistrement(true);
    try {
      const { modifications: m } = ed;
      const detail = await modifierModele(modele.id, {
        ...(m.proprietes ? proprietes : {}),
        contenu: m.contenu ? contenu() : undefined,
        miseEnPage: m.miseEnPage ? miseEnPage() : undefined,
      });
      recharger(detail);
      const version = detail.versionCourante ? ' — version ' + String(detail.versionCourante) : '';
      toast(`Modèle enregistré${version}.`);
    } catch (err) {
      toast({ texte: err instanceof Error ? err.message : "Échec de l'enregistrement.", variante: 'erreur' });
    } finally {
      setEnregistrement(false);
    }
  }

  async function restaurer(numero: number) {
    const detail = await restaurerVersionModele(modele.id, numero);
    recharger(detail);
    setDialogue(null);
    toast(`Version ${numero} restaurée en version ${detail.versionCourante ?? ''}.`);
  }

  function ouvrirRegle(type: 'condition' | 'repetition' | 'repetitionPage') {
    setSelectionVide(actif.state.selection.empty);
    setDialogue(type);
  }

  const actions = (
    <>
      {modifie && <Badge tone="warning">Non enregistré</Badge>}
      <Button type="button" variant="outline" size="sm" onClick={() => setDialogue('historique')}>
        <History data-icon="inline-start" /> Historique
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={() => setDialogue('apercu')}>
        <Eye data-icon="inline-start" /> Aperçu
      </Button>
      <Button type="button" size="sm" disabled={!modifie || enregistrement} onClick={() => void enregistrer()}>
        <Save data-icon="inline-start" /> {enregistrement ? 'Enregistrement…' : 'Enregistrer'}
      </Button>
    </>
  );

  return (
    <PageShell
      title={modele.libelle}
      crumbs={[{ label: 'Administration' }, { label: 'Modèles de documents', to: '/modeles-documents' }, { label: modele.libelle }]}
      icon={<FileCode2 />}
      accent="var(--sec-accent)"
      accentBg="var(--sec-accent-bg)"
      actions={actions}
      fullHeight
    >
      <div className="editeur-modele flex h-full min-h-0 flex-col gap-2 lg:flex-row">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
            <BarreOutilsModele
              editor={actif}
              onCondition={() => ouvrirRegle('condition')}
              onRepeter={() => ouvrirRegle('repetition')}
              onRepeterPage={() => ouvrirRegle('repetitionPage')}
              blocsActifs={actif === ed.corps}
              onErreur={(message) => toast({ texte: message, variante: 'erreur' })}
            />
            <ProprietesBlocPositionne editor={actif} />
            <div className="min-h-0 flex-1 overflow-auto rounded-lg bg-muted/50 p-3 sm:p-6">
              <div
                className="editeur-modele-page mx-auto bg-white text-black shadow-sm"
                style={{
                  padding: `${marges.margeHaut}mm ${marges.margeDroite}mm ${marges.margeBas}mm ${marges.margeGauche}mm`,
                  ...(fond.fondImageId && {
                    backgroundImage: `url(${urlImageModele(fond.fondImageId)})`,
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: fond.fondPleinePage ? '100% 100%' : 'auto',
                  }),
                }}
              >
                <EditorContent editor={ed.corps} />
              </div>
            </div>
          </div>
          <aside className="flex min-h-0 w-full shrink-0 flex-col rounded-lg border border-border bg-card p-2 lg:w-80">
            <Tabs value={onglet} onValueChange={(v) => setOnglet(v as 'champs' | 'page')} className="min-h-0 flex-1">
              <TabsList className="w-full">
                <TabsTrigger value="champs">Champs</TabsTrigger>
                <TabsTrigger value="page">Mise en page</TabsTrigger>
              </TabsList>
              <TabsContent value="champs" className="flex min-h-0 flex-col">
                <PanneauChamps catalogue={catalogue} listeActive={listeActive} onInserer={(c) => insererChamp(actif, c)} />
              </TabsContent>
              <TabsContent value="page" className="flex min-h-0 flex-col">
                <PanneauMiseEnPage
                  proprietes={proprietes}
                  onProprietes={(p) => {
                    setProprietes(p);
                    ed.marquer('proprietes');
                  }}
                  marges={marges}
                  onMarges={(m) => {
                    setMarges(m);
                    ed.marquer('miseEnPage');
                  }}
                  fond={fond}
                  onFond={(f) => {
                    setFond(f);
                    ed.marquer('miseEnPage');
                  }}
                  enTete={ed.enTete}
                  pied={ed.pied}
                />
              </TabsContent>
            </Tabs>
          </aside>
        </div>

      {dialogue === 'condition' && (
        <DialogueCondition
          catalogue={catalogue}
          listeActive={listeActive}
          selectionVide={selectionVide}
          onClose={() => setDialogue(null)}
          onAppliquer={(si, valeur, portee) => {
            appliquerCondition(actif, si, valeur, portee);
            setDialogue(null);
          }}
        />
      )}
      {dialogue === 'repetition' && (
        <DialogueRepetition
          catalogue={catalogue}
          onClose={() => setDialogue(null)}
          onAppliquer={(liste) => {
            appliquerRepetition(actif, liste);
            setDialogue(null);
          }}
        />
      )}
      {dialogue === 'repetitionPage' && (
        <DialogueRepetition
          catalogue={catalogue}
          onClose={() => setDialogue(null)}
          onAppliquer={(liste) => {
            repeterPage(actif, liste);
            setDialogue(null);
          }}
        />
      )}
      {dialogue === 'apercu' && (
        <DialogueApercuModele
          onClose={() => setDialogue(null)}
          onChoisir={(d) => ouvrirApercuModele(modele.id, { contenu: contenu(), miseEnPage: miseEnPage(), ficheId: d.id })}
        />
      )}
      {dialogue === 'historique' && (
        <DialogueHistoriqueModele modeleId={modele.id} onRestaurer={restaurer} onClose={() => setDialogue(null)} />
      )}
    </PageShell>
  );
}
