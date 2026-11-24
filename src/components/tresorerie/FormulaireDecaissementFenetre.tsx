import { useState } from 'react';
import { FileCheck, FileText, ListChecks, Save, SaveAll, X } from 'lucide-react';
import BarreIcones from '../BarreIcones';
import FenetreFiche from '../fiche/FenetreFiche';
import { ErrorState, LoadingState } from '../ui';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import ChampsDecaissement from './ChampsDecaissement';
import DialoguePiecesAAffecter from './DialoguePiecesAAffecter';
import OngletDeductions from './OngletDeductions';
import { getBanques, oublierLecturesRecentes } from '../../lib/api';
import { getReferentielsAchat } from '../../lib/apiAchat';
import { getReferentielPatrimoine } from '../../lib/apiPatrimoine';
import {
  creerDecaissement, genererCodeFeuillePaiement, genererCodeFeuilleRs, getDecaissement, lireReferentielsDecaissement, modifierDecaissement,
} from '../../lib/apiTresorerie';
import { useToast } from '../../lib/toastContext';
import { brouillonVide, partMasquee, verifier, versRequete } from '../../lib/saisieDecaissement';
import { errorMessage, refetchAllApis, useApi } from '../../lib/useApi';
import type { UUID } from '../../types';
import type { CodeFeuilleDto, DecaissementFicheDto, ModuleTresorerie, ReferentielsDecaissementDto, SaisieDecaissementDto } from '../../types/tresorerie';

const NATURE = 'Décaissement';

const option = (id: string, libelle: string | null | undefined) => ({ value: id, label: libelle ?? '—' });

function Saisie({ module, referentiels: ref, fiche, initial, tiers, banques, tiersAutrui, onFermer, onCree }: Readonly<{
  module: ModuleTresorerie;
  referentiels: ReferentielsDecaissementDto;
  fiche: DecaissementFicheDto | null;
  initial?: SaisieDecaissementDto;
  tiers: { id: string; nom: string | null }[];
  banques: { id: string; description?: string }[];
  tiersAutrui: { id: string; description?: string }[];
  onFermer: () => void;
  onCree: (id: UUID) => void;
}>) {
  const [b, setB] = useState<SaisieDecaissementDto>(
    () => fiche?.saisie ?? initial ?? brouillonVide(ref.societes.length === 1 ? ref.societes[0].id : null),
  );
  const [masquee] = useState(() => (fiche ? partMasquee(fiche.decaissement.montantAffecte, fiche.saisie.lignes) : 0));
  const [message, setMessage] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [pieces, setPieces] = useState(false);
  const toast = useToast();
  const maj = (patch: Partial<SaisieDecaissementDto>) => setB((s) => ({ ...s, ...patch }));
  const id = fiche?.decaissement.id;
  const titre = fiche ? `Modifier le décaissement ${fiche.decaissement.code ?? ''}` : 'Nouveau décaissement';
  const type = ref.types.find((t) => t.id === b.typeId);
  const listes = {
    societes: ref.societes.map((s) => option(s.id, s.libelle ?? s.code)),
    types: ref.types.map((t) => option(t.id, t.libelle ?? t.code)),
    comptes: ref.comptes.filter((c) => !b.societeId || c.societeId === b.societeId).map((c) => option(c.id, c.code)),
    banques: banques.map((x) => option(x.id, x.description)),
    tiers: tiers.map((t) => option(t.id, t.nom)),
    tiersAutrui: tiersAutrui.map((t) => option(t.id, t.description)),
  };

  /** `apres` : appelé avec l'id enregistré (génération d'un code) avant de fermer ou de basculer. */
  async function enregistrer(fermer: boolean, apres?: (decaissementId: UUID) => Promise<void>) {
    const erreur = verifier(b, type, masquee);
    setMessage(erreur);
    if (erreur) return;
    setEnCours(true);
    try {
      const requete = versRequete(b, id ? null : module);
      const enregistre = await (id ? modifierDecaissement(id, requete) : creerDecaissement(requete));
      oublierLecturesRecentes();
      refetchAllApis();
      await apres?.(enregistre.decaissement.id);
      if (fermer) onFermer();
      // Création : la saisie bascule sur le décaissement créé, sinon un second clic le dupliquerait.
      else if (!id) onCree(enregistre.decaissement.id);
    } catch (err) {
      oublierLecturesRecentes();
      setMessage(errorMessage(err));
    } finally {
      setEnCours(false);
    }
  }

  const genererCode = (generer: (decaissementId: UUID) => Promise<CodeFeuilleDto>, cle: 'codeFeuillePaiement' | 'codeFeuilleRs') =>
    enregistrer(false, async (decaissementId) => {
      try {
        maj({ [cle]: (await generer(decaissementId)).code });
        refetchAllApis();
      } catch (err) {
        toast({ texte: errorMessage(err), variante: 'erreur' });
      }
    });

  return (
    <FenetreFiche nature={NATURE} titre={titre} onFermer={onFermer} enEdition>
      <BarreIcones className="flex shrink-0 items-center gap-1 border-b border-border px-3 py-1">
        <Button type="button" variant="ghost" size="sm" disabled={enCours} onClick={() => void enregistrer(false)}><Save /> Enregistrer</Button>
        <Button type="button" variant="ghost" size="sm" disabled={enCours} onClick={() => void enregistrer(true)}><SaveAll /> Enregistrer et fermer</Button>
        <Button type="button" variant="ghost" size="sm" disabled={!b.fournisseurId || !b.societeId} onClick={() => setPieces(true)}><ListChecks /> Affecter des pièces</Button>
        <Button type="button" variant="ghost" size="sm" disabled={enCours} onClick={() => void genererCode(genererCodeFeuillePaiement, 'codeFeuillePaiement')}><FileText /> P.P.</Button>
        {ref.gestionRs && (
          <Button type="button" variant="ghost" size="sm" disabled={enCours} onClick={() => void genererCode(genererCodeFeuilleRs, 'codeFeuilleRs')}><FileCheck /> C.R.A.S.</Button>
        )}
        <Button type="button" variant="ghost" size="sm" onClick={onFermer}><X /> Annuler</Button>
        {message && <span role="alert" className="ml-2 text-body text-destructive">{message}</span>}
      </BarreIcones>
      <div className="min-h-0 flex-1 overflow-auto px-4 py-3">
        <ChampsDecaissement
          b={b}
          maj={maj}
          listes={listes}
          masquee={masquee}
          gestionRs={ref.gestionRs}
          societeModifiable={!id || ref.droits.peutChangerSociete}
          codes={{ codeRecu: b.codeRecu ?? null, codeFeuillePaiement: b.codeFeuillePaiement ?? null, codeFeuilleRs: b.codeFeuilleRs ?? null }}
        />
        {ref.gestionRs && (
          <Tabs defaultValue="deductions" className="mt-3">
            <TabsList><TabsTrigger value="deductions">Déductions</TabsTrigger></TabsList>
            <TabsContent value="deductions"><OngletDeductions b={b} referentiels={ref} maj={maj} /></TabsContent>
          </Tabs>
        )}
      </div>
      {pieces && b.fournisseurId && b.societeId && (
        <DialoguePiecesAAffecter
          module={module}
          fournisseurId={b.fournisseurId}
          societeId={b.societeId}
          reglementId={id}
          lignes={b.lignes}
          onValider={(lignes) => maj({ lignes })}
          onClose={() => setPieces(false)}
        />
      )}
    </FenetreFiche>
  );
}

/** Saisie d'un décaissement : création (sans `id`) ou modification. */
export default function FormulaireDecaissementFenetre({ module, id, initial, onFermer, onCree }: Readonly<{
  module: ModuleTresorerie;
  id?: UUID;
  /** Création préremplie (copie ou proposition de règlement). */
  initial?: SaisieDecaissementDto;
  onFermer: () => void;
  onCree: (id: UUID) => void;
}>) {
  const ref = useApi(() => lireReferentielsDecaissement(module), [module], `decaissement-ref-${module}`);
  const fiche = useApi(() => (id ? getDecaissement(id) : Promise.resolve(null)), [id]);
  const achat = useApi(() => getReferentielsAchat(), [], 'achat-referentiels');
  const banques = useApi(() => getBanques(), [], 'banques');
  const autrui = useApi(() => getReferentielPatrimoine('tiers-autrui'), [], 'patrimoine-tiers-autrui');
  const titre = id ? 'Modifier le décaissement' : 'Nouveau décaissement';
  const erreur = ref.error ?? fiche.error ?? achat.error ?? banques.error;

  if (erreur || !ref.data || fiche.loading || !achat.data || !banques.data) {
    return (
      <FenetreFiche nature={NATURE} titre={titre} onFermer={onFermer}>
        {erreur ? <ErrorState message={erreur} /> : <LoadingState />}
      </FenetreFiche>
    );
  }
  return (
    <Saisie
      module={module}
      referentiels={ref.data}
      fiche={fiche.data}
      initial={initial}
      tiers={achat.data.fournisseurs}
      banques={banques.data}
      tiersAutrui={autrui.data ?? []}
      onFermer={onFermer}
      onCree={onCree}
    />
  );
}
