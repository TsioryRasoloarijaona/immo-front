import { useState } from 'react';
import { Card } from '../../components/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { ChampSelect, ChampsDeclares, PiedFormulaire, type OptionSelect } from '../../components/patrimoine/SaisiePatrimoine';
import {
  chargerRepartitionDepuisGroupe,
  createEntiteJuridique,
  listActionnaires,
  listDevises,
  listGroupesActionnaires,
  updateEntiteJuridique,
} from '../../lib/api';
import { useConfirm } from '../../lib/confirmContext';
import { referentielItems, usePays, usePersonnels } from '../../lib/referentiels';
import { avecChampsAVider, messageDuChamp, useSoumission, type DefChamp } from '../../lib/saisiePatrimoine';
import { useToast } from '../../lib/toastContext';
import { errorMessage, useApi } from '../../lib/useApi';
import type { EntiteJuridiqueDto, EntiteJuridiqueEcritureDto } from '../../types';
import { ADMINISTRATION, AUTRES, COORDONNEES, IDENTIFICATION, PARTS, SAISIS, lignesEcriture } from './champsEntite';
import { SaisieRepartition } from './RepartitionEntite';

const MESSAGE_DESACTIVER =
  'Désactiver cette entité masque ses programmes, tranches, articles, prospections et dossiers dans tout le CRM. Continuer ?';
const MESSAGE_REACTIVER =
  'Réactiver cette entité rend de nouveau visibles ses programmes, tranches, articles, prospections et dossiers dans tout le CRM. Continuer ?';

function options<T extends { id: string; code?: string | null; description?: string | null }>(liste: T[] | null): OptionSelect[] {
  return (liste ?? []).map((x) => ({ label: [x.code, x.description].filter(Boolean).join(' — ') || x.id, value: x.id }));
}

function useReferencesEntite() {
  const pays = usePays();
  const personnels = referentielItems(usePersonnels().data);
  const devises = useApi(listDevises, []);
  const groupes = useApi(listGroupesActionnaires, []);
  const actionnaires = useApi(listActionnaires, []);
  const references: Partial<Record<string, OptionSelect[]>> = {
    deviseId: options(devises.data),
    paysId: pays.data.map((p) => ({ label: p.description || p.code || p.id, value: p.id })),
    representantLegalId: personnels,
    signataireId: personnels,
    responsableTechniqueId: personnels,
    responsableCommercialId: personnels,
  };
  return { references, groupes: options(groupes.data), actionnaires: options(actionnaires.data) };
}

/** Le PATCH ne renvoie la répartition que si elle a changé : sinon le serveur la réécrirait à l'identique. */
function corpsAEnvoyer(initial: EntiteJuridiqueEcritureDto, form: EntiteJuridiqueEcritureDto, creation: boolean) {
  const corps = avecChampsAVider(initial, form, SAISIS);
  if (!creation && JSON.stringify(initial.repartition ?? []) === JSON.stringify(form.repartition ?? [])) {
    return { ...corps, repartition: undefined };
  }
  return corps;
}

/** Fiche débloquée (édition) ou création : mêmes onglets que la lecture. */
export default function FormulaireEntite({
  id,
  initial,
  onEnregistre,
  onAnnuler,
}: Readonly<{
  id?: string;
  initial: EntiteJuridiqueEcritureDto;
  onEnregistre: (entite: EntiteJuridiqueDto) => void;
  onAnnuler: () => void;
}>) {
  const confirmer = useConfirm();
  const toast = useToast();
  const [form, setForm] = useState<EntiteJuridiqueEcritureDto>(initial);
  const [onglet, setOnglet] = useState('coordonnees');
  const { enCours, erreur, soumettre } = useSoumission();
  const { references, groupes, actionnaires } = useReferencesEntite();

  const changer = (nom: keyof EntiteJuridiqueEcritureDto, valeur: unknown) => setForm((f) => ({ ...f, [nom]: valeur }));
  const champs = (defs: DefChamp<EntiteJuridiqueEcritureDto>[]) => (
    <ChampsDeclares prefixe="ent" defs={defs} form={form} onChange={changer} erreur={erreur} references={references} />
  );

  /** OMRAN `CfgGroupShareholderSelectBox_ValueChanged` : recharger la répartition seulement si l'utilisateur le veut. */
  async function choisirGroupe(groupeId: string | undefined) {
    changer('groupeId', groupeId);
    if (!groupeId || !id) return;
    const charger = await confirmer({
      title: 'Répartition',
      message: 'Est ce que vous voulez charger les répartitions !!',
      confirmLabel: 'Charger',
      cancelLabel: 'Non',
    });
    if (!charger) return;
    try {
      const recalculee = await chargerRepartitionDepuisGroupe(id, groupeId, form.nombreParts);
      setForm((f) => ({
        ...f,
        groupeId,
        nombreActionnaires: recalculee.nombreActionnaires,
        nombreParts: recalculee.nombreParts,
        repartition: lignesEcriture(recalculee),
      }));
      toast({ texte: 'Répartition chargée depuis le groupe et enregistrée.', variante: 'succes' });
    } catch (err) {
      toast({ texte: errorMessage(err), variante: 'erreur' });
    }
  }

  async function enregistrer() {
    if (id && initial.actif !== form.actif) {
      const ok = await confirmer({
        title: form.actif ? 'Réactiver l’entité' : 'Désactiver l’entité',
        message: form.actif ? MESSAGE_REACTIVER : MESSAGE_DESACTIVER,
        confirmLabel: form.actif ? 'Réactiver' : 'Désactiver',
      });
      if (!ok) return;
    }
    const corps = corpsAEnvoyer(initial, form, !id);
    await soumettre(() => (id ? updateEntiteJuridique(id, corps) : createEntiteJuridique(corps)), onEnregistre);
  }

  return (
    <div className="flex flex-col gap-3">
      <Card title="Identification" accent="var(--sec-projet)">{champs(IDENTIFICATION)}</Card>
      <Tabs value={onglet} onValueChange={(v) => setOnglet(v as string)}>
        <TabsList>
          <TabsTrigger value="coordonnees">Coordonnées</TabsTrigger>
          <TabsTrigger value="administration">Administration</TabsTrigger>
          <TabsTrigger value="repartition">Répartition</TabsTrigger>
          <TabsTrigger value="autres">Autres</TabsTrigger>
        </TabsList>
        <TabsContent value="coordonnees"><Card>{champs(COORDONNEES)}</Card></TabsContent>
        <TabsContent value="administration"><Card>{champs(ADMINISTRATION)}</Card></TabsContent>
        <TabsContent value="repartition">
          <Card>
            <div className="flex flex-col gap-3.5">
              <ChampSelect
                id="ent-groupe"
                libelle="Groupe d'actionnaires"
                options={groupes}
                valeur={form.groupeId}
                onChange={(v) => void choisirGroupe(v)}
                message={messageDuChamp(erreur, 'groupeId')}
                effacable
                aide={
                  id
                    ? 'Propose de recharger la répartition sur le nombre de parts saisi ; le chargement est enregistré aussitôt.'
                    : 'La répartition se charge depuis un groupe une fois l’entité créée.'
                }
              />
              {champs(PARTS)}
              <SaisieRepartition
                lignes={form.repartition ?? []}
                onChange={(lignes) => changer('repartition', lignes)}
                actionnaires={actionnaires}
                message={messageDuChamp(erreur, 'repartition')}
              />
            </div>
          </Card>
        </TabsContent>
        <TabsContent value="autres"><Card>{champs(AUTRES)}</Card></TabsContent>
      </Tabs>
      <PiedFormulaire
        erreur={erreur}
        enCours={enCours}
        libelle={id ? 'Enregistrer' : "Créer l'entité"}
        onAnnuler={onAnnuler}
        onValider={() => void enregistrer()}
      />
    </div>
  );
}
