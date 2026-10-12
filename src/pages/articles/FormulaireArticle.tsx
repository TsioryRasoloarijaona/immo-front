import { useState } from 'react';
import { Lock } from 'lucide-react';
import { Card, Field, FieldGrid } from '../../components/ui';
import { ChampSelect, ChampsDeclares, GrilleSaisie, PiedFormulaire } from '../../components/patrimoine/SaisiePatrimoine';
import { messageDuChamp, useSoumission } from '../../lib/saisiePatrimoine';
import { calculerPrixArticle } from '../../lib/prixArticle';
import { formatCurrency } from '../../lib/format';
import {
  referentielItems,
  useCategoriesArticle,
  useCategoriesSousArticle,
  useEtages,
  useImmeubles,
  useTranchesFiltre,
  useTypesArticle,
  useTypesSousArticle,
  useVocationsArticle,
} from '../../lib/referentiels';
import type { ArticleDetailDto } from '../../types';
import { DIVERS, FONCIER, IDENTITE, REMISES, SURFACES_PRIX, estProtege, figer, type SaisieArticle } from './champsArticle';

const TOUJOURS_AFFECTE = [{ nom: 'toujoursAffecte' as const, libelle: 'Toujours affecté à l’article', genre: 'case' as const }];

function ApercuPrix({ form }: Readonly<{ form: SaisieArticle }>) {
  const prix = calculerPrixArticle(form);
  return (
    <div className="mt-3.5 rounded-lg bg-muted/40 px-3 py-2.5">
      <p className="mb-2 text-micro font-medium text-muted-foreground">Calculé à la saisie, recalculé à l’enregistrement</p>
      <FieldGrid>
        <Field label="Prix du m² provisoire TTC" value={formatCurrency(prix.m2ProvisoireTTC)} />
        <Field label="Prix article provisoire HT" value={formatCurrency(prix.articleProvisoireHT)} />
        <Field label="Prix article provisoire TTC" value={formatCurrency(prix.articleProvisoireTTC)} />
        <Field label="Prix du m² définitif TTC" value={formatCurrency(prix.m2DefinitifTTC)} />
        <Field label="Prix article définitif HT" value={formatCurrency(prix.articleDefinitifHT)} />
        <Field label="Prix article définitif TTC" value={formatCurrency(prix.articleDefinitifTTC)} />
      </FieldGrid>
    </div>
  );
}

export default function FormulaireArticle({
  sousArticle,
  initial,
  trancheVerrouillee,
  dossierOccupant,
  creation,
  enregistrer,
  apres,
  annuler,
}: Readonly<{
  sousArticle: boolean;
  initial: SaisieArticle;
  trancheVerrouillee: boolean;
  /** Code du dossier qui fige prix, surfaces et classification ; `null` si l'article est libre. */
  dossierOccupant: string | null;
  creation: boolean;
  enregistrer: (form: SaisieArticle) => Promise<ArticleDetailDto>;
  apres: (article: ArticleDetailDto) => void;
  annuler: () => void;
}>) {
  const [form, setForm] = useState<SaisieArticle>(initial);
  const { enCours, erreur, soumettre } = useSoumission();
  const occupe = dossierOccupant !== null;
  const tranches = useTranchesFiltre();
  const vocations = useVocationsArticle();
  const categoriesArticle = useCategoriesArticle();
  const categoriesSous = useCategoriesSousArticle();
  const typesArticle = useTypesArticle();
  const typesSous = useTypesSousArticle();
  const immeubles = useImmeubles();
  const etages = useEtages();

  const changer = (nom: keyof SaisieArticle, valeur: unknown) => setForm((f) => ({ ...f, [nom]: valeur }));
  const selectProps = (nom: keyof SaisieArticle) => ({
    id: `art-${nom}`,
    valeur: form[nom] as string | undefined,
    onChange: (v: string | undefined) => changer(nom, v),
    message: messageDuChamp(erreur, nom),
    desactive: occupe && estProtege(nom),
  });
  const champs = (defs: typeof IDENTITE) => (
    <ChampsDeclares prefixe="art" defs={occupe ? figer(defs) : defs} form={form} onChange={changer} erreur={erreur} />
  );
  const optionsTranches = tranches.data.map((t) => ({ label: `${t.code ?? ''} — ${t.description ?? ''}`, value: t.id }));

  return (
    <div className="flex max-w-200 flex-col gap-3">
      {occupe && (
        <p className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-body text-muted-foreground">
          <Lock className="size-4 shrink-0" />
          Affecté au dossier {dossierOccupant} : prix, surfaces et classification ne se modifient plus.
        </p>
      )}
      <Card title="Identité" accent="var(--sec-tranche)">
        <div className="flex flex-col gap-3.5">
          <GrilleSaisie>
            {!sousArticle && (
              <ChampSelect {...selectProps('trancheId')} libelle="Tranche" requis options={optionsTranches} desactive={trancheVerrouillee}
                aide={trancheVerrouillee ? "La tranche d'un article ne se modifie pas." : undefined} />
            )}
            {!sousArticle && (
              <ChampSelect {...selectProps('vocationId')} libelle="Vocation" options={referentielItems(vocations.data)}
                aide={creation ? 'VENTE si aucune vocation n’est choisie.' : undefined} />
            )}
          </GrilleSaisie>
          {champs(IDENTITE)}
          <GrilleSaisie>
            <ChampSelect {...selectProps('categorieId')} libelle="Catégorie" requis
              options={referentielItems(sousArticle ? categoriesSous.data : categoriesArticle.data)} />
            <ChampSelect {...selectProps('typeId')} libelle="Type" requis
              options={referentielItems(sousArticle ? typesSous.data : typesArticle.data)} />
            <ChampSelect {...selectProps('immeubleId')} libelle="Immeuble" requis options={referentielItems(immeubles.data)} />
            <ChampSelect {...selectProps('etageId')} libelle="Étage" requis options={referentielItems(etages.data)} />
          </GrilleSaisie>
        </div>
      </Card>
      <Card title="Surfaces et prix">
        {champs(SURFACES_PRIX)}
        <ApercuPrix form={form} />
      </Card>
      <Card title="Remises">{champs(REMISES)}</Card>
      <Card title="Foncier">{champs(FONCIER)}</Card>
      <Card title="Divers">
        {champs(DIVERS)}
        {sousArticle && creation && (
          <div className="mt-3.5">
            <ChampsDeclares prefixe="art" defs={TOUJOURS_AFFECTE} form={form} onChange={changer} erreur={erreur} />
          </div>
        )}
      </Card>
      <PiedFormulaire
        erreur={erreur}
        enCours={enCours}
        libelle={creation ? 'Créer' : 'Enregistrer'}
        onAnnuler={annuler}
        onValider={() => void soumettre(() => enregistrer(form), apres)}
      />
    </div>
  );
}
