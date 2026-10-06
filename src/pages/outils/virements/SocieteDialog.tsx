import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { DialogFooter } from "../../../components/ui/dialog";
import {
  Field as FormField,
  FieldGroup,
  FieldLabel,
} from "../../../components/ui/field";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { todayISO } from "../../../lib/format";
import {
  LIEN_LOGO_DEFAUT,
  creerSociete,
  deposerLogo,
  lienLogoSociete,
  modifierSociete,
  retirerLogo,
} from "../../../lib/virements";
import ApercuCourrier from "./ApercuCourrier";
import { ChoixSimple } from "./CadreVirements";
import { rafraichir } from "./contexte";
import { MODELE_GHRIZA } from "./donnees";
import ModaleSaisie from "./ModaleSaisie";
import type {
  Bit,
  EnteteMode,
  Police,
  Societe,
  SocieteSaisie,
  TypeVirement,
} from "./types";
import { useConfirmation } from "./useConfirmation";
import type { Notifications } from "./useNotification";

const POLICE_ITEMS: { value: Police; label: string }[] = [
  { value: "helvetica", label: "Helvetica (sans empattement)" },
  { value: "times", label: "Times (avec empattements)" },
];
const ENTETE_ITEMS: { value: EnteteMode; label: string }[] = [
  { value: "logo", label: "Logo" },
  { value: "texte", label: "Texte" },
  { value: "aucun", label: "Aucun" },
];

const APERCU_ITEMS: { value: TypeVirement; label: string }[] = [
  { value: "fournisseur", label: "Aperçu : règlement fournisseur" },
  { value: "salaire", label: "Aperçu : salaire" },
];

/** Ligne fictive de l'aperçu : le modèle se règle en le regardant, pas en
 * générant un PDF d'essai à chaque retouche. */
const LIGNE_EXEMPLE: Record<
  TypeVirement,
  { beneficiaire: string; rib: string; montant: number }
> = {
  fournisseur: {
    beneficiaire: "SOTRAMEC SARL",
    rib: "230 780 4521873211004500 12",
    montant: 185000,
  },
  salaire: {
    beneficiaire: "Monsieur Othman DIOURI",
    rib: "230 780 0000998877665544 10",
    montant: 18500,
  },
};

const CHAMPS_SAISIE: (keyof SocieteSaisie)[] = [
  "nom",
  "banque",
  "ville",
  "compte",
  "signataire",
  "par_defaut",
  "police",
  "entete_mode",
  "entete_titre",
  "entete_sous_titre",
  "entete_droite",
  "entete_taille",
  "entete_filet",
  "objet",
  "phrase_corps",
  "phrase_ligne",
  "phrase_corps_salaire",
  "phrase_ligne_salaire",
  "signataire_gauche",
  "pied_page",
  "avec_cloture",
  "salutation_grasse",
  "societe_grasse",
  "montants_gras",
  "beneficiaire_gras",
];

function saisieDe(s: Societe): SocieteSaisie {
  return Object.fromEntries(
    CHAMPS_SAISIE.map((k) => [k, s[k]]),
  ) as unknown as SocieteSaisie;
}

function Section({
  titre,
  aide,
  children,
}: {
  titre: string;
  aide?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="border-b border-border pb-1 text-label font-semibold text-foreground">
        {titre}
      </h2>
      {aide && <p className="-mt-1 text-micro text-muted-foreground">{aide}</p>}
      {children}
    </section>
  );
}

function Case({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: Bit) => void;
  children: ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-body text-foreground">
      <input
        type="checkbox"
        className="size-3.5 shrink-0 accent-primary"
        checked={checked}
        onChange={(e) => onChange(e.target.checked ? 1 : 0)}
      />
      {children}
    </label>
  );
}

/** Société émettrice (§10.1) : identité et modèle de courrier. Enregistrement
 * en deux temps — la fiche (JSON, cases en 0/1), puis le logo s'il y en a un
 * de choisi, avec l'`id` renvoyé. */
export default function SocieteDialog({
  societe,
  premiere,
  onClose,
  toasts,
}: {
  societe?: Societe;
  /** Aucune société encore : « par défaut » est coché d'office. */
  premiere: boolean;
  onClose: () => void;
  toasts: Notifications;
}) {
  const [initial] = useState<SocieteSaisie>(() =>
    societe
      ? saisieDe(societe)
      : {
          ...MODELE_GHRIZA,
          nom: "",
          banque: "",
          ville: "",
          compte: "",
          signataire: "",
          par_defaut: premiere ? 1 : 0,
        },
  );
  const [s, setS] = useState<SocieteSaisie>(initial);
  const [logoActuel, setLogoActuel] = useState<{
    present: boolean;
    version: string;
  }>({
    present: Boolean(societe?.logo),
    version: societe?.updated_at ?? "",
  });
  const [nouveauLogo, setNouveauLogo] = useState<File | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  // Créée, mais le logo a échoué : un nouvel essai modifie la fiche au lieu
  // d'en recréer une (qui serait refusée, nom déjà pris).
  const [creeId, setCreeId] = useState<number | null>(null);
  const [confirmation, demander] = useConfirmation();
  const [apercu, setApercu] = useState<TypeVirement>("fournisseur");
  const maj = (patch: Partial<SocieteSaisie>) =>
    setS((x) => ({ ...x, ...patch }));

  // Aperçu nourri par la saisie en cours, non enregistrée comprise. Logo : le
  // fichier choisi s'il y en a un, sinon le logo actuel, sinon celui par défaut.
  const urlNouveauLogo = useMemo(
    () => (nouveauLogo ? URL.createObjectURL(nouveauLogo) : null),
    [nouveauLogo],
  );
  useEffect(
    () => () => {
      if (urlNouveauLogo) URL.revokeObjectURL(urlNouveauLogo);
    },
    [urlNouveauLogo],
  );
  const logoApercu =
    urlNouveauLogo ??
    (societe && logoActuel.present
      ? lienLogoSociete(societe.id, logoActuel.version)
      : LIEN_LOGO_DEFAUT);
  const societeApercu: Societe = {
    ...s,
    id: societe?.id ?? 0,
    logo: null,
    created_at: societe?.created_at ?? "",
    updated_at: logoActuel.version,
  };
  const modifie =
    nouveauLogo !== null || CHAMPS_SAISIE.some((k) => s[k] !== initial[k]);

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault();
    if (enCours) return;
    // Le service remplacerait en silence une taille hors bornes par 22.
    if (!Number.isInteger(s.entete_taille) || s.entete_taille < 8 || s.entete_taille > 48) {
      setErreur("La taille du titre de l'en-tête doit être un nombre entier de 8 à 48 pt.");
      return;
    }
    setErreur(null);
    setEnCours(true);
    const idExistant = societe?.id ?? creeId;
    let id = idExistant ?? undefined;
    try {
      const fiche =
        idExistant != null
          ? await modifierSociete(idExistant, s)
          : await creerSociete(s);
      id = fiche.id;
      if (!societe) setCreeId(fiche.id);
      if (nouveauLogo) await deposerLogo(fiche.id, nouveauLogo);
      rafraichir();
      toasts.notifier(
        `Société « ${fiche.nom} » ${societe ? "modifiée" : "ajoutée"} avec succès.`,
      );
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue.";
      // La fiche a pu être enregistrée avant l'échec du logo : la liste est relue.
      if (id !== undefined) rafraichir();
      setErreur(`Impossible d'enregistrer la société : ${msg}`);
    } finally {
      setEnCours(false);
    }
  }

  async function retirer() {
    if (!societe) return;
    const ok = await demander({
      titre: "Retirer ce logo ?",
      message: "Sans image, le logo GHRIZA sert d'en-tête.",
      confirmer: "Retirer le logo",
      danger: true,
    });
    if (!ok) return;
    try {
      const fiche = await retirerLogo(societe.id);
      setLogoActuel({ present: false, version: fiche.updated_at });
      rafraichir();
      toasts.notifier("Logo retiré avec succès.");
    } catch (err) {
      toasts.notifierErreur(err, "Impossible de retirer le logo");
    }
  }

  const champ = (
    id: keyof SocieteSaisie,
    libelle: string,
    props: { placeholder?: string; mono?: boolean } = {},
  ) => (
    <FormField>
      <FieldLabel htmlFor={`so-${id}`}>{libelle}</FieldLabel>
      <Input
        id={`so-${id}`}
        value={String(s[id] ?? "")}
        onChange={(e) =>
          maj({ [id]: e.target.value } as Partial<SocieteSaisie>)
        }
        placeholder={props.placeholder}
        className={props.mono ? "font-mono" : undefined}
      />
    </FormField>
  );
  const texte = (
    id: keyof SocieteSaisie,
    libelle: string,
    props: { placeholder?: string; rows?: number } = {},
  ) => (
    <FormField>
      <FieldLabel htmlFor={`so-${id}`}>{libelle}</FieldLabel>
      <Textarea
        id={`so-${id}`}
        rows={props.rows ?? 2}
        value={String(s[id] ?? "")}
        onChange={(e) =>
          maj({ [id]: e.target.value } as Partial<SocieteSaisie>)
        }
        placeholder={props.placeholder}
      />
    </FormField>
  );

  return (
    <ModaleSaisie
      titre={societe ? `Modifier ${societe.nom}` : "Ajouter une société"}
      modifie={modifie}
      onClose={onClose}
      width="min(1180px, calc(100vw - 2rem))"
    >
      {(fermer) => (
        <>
          <form onSubmit={enregistrer} autoComplete="off" noValidate>
            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
              <FieldGroup>
                <Section titre="Identité">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {champ("nom", "Nom", { placeholder: "Ex : GHRIZA" })}
                    {champ("banque", "Banque", {
                      placeholder: "Ex : CIH BANK",
                    })}
                    {champ("ville", "Ville", {
                      placeholder: "Ex : CASABLANCA",
                    })}
                    {champ("compte", "Numéro de compte", { mono: true })}
                    {champ("signataire", "Signataire", {
                      placeholder: "Ex : M. Ali Jamal DIOURI",
                    })}
                    <FormField>
                      <FieldLabel htmlFor="so-logo">Logo</FieldLabel>
                      <Input
                        id="so-logo"
                        type="file"
                        accept=".png,.jpg,.jpeg"
                        onChange={(e) =>
                          setNouveauLogo(e.target.files?.[0] ?? null)
                        }
                      />
                    </FormField>
                  </div>
                  <p className="-mt-1 text-micro text-muted-foreground">
                    PNG ou JPG, 2 Mo maximum. Un bandeau large convient le mieux
                    (le logo GHRIZA fait 1416 × 234 px) ; sans image, le logo
                    GHRIZA sert.
                  </p>
                  {societe && logoActuel.present && !nouveauLogo && (
                    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/40 p-2">
                      <img
                        src={lienLogoSociete(societe.id, logoActuel.version)}
                        alt={`Logo actuel de ${societe.nom}`}
                        className="h-10 max-w-72 object-contain"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => void retirer()}
                      >
                        <Trash2 data-icon="inline-start" /> Retirer ce logo
                      </Button>
                    </div>
                  )}
                  <Case
                    checked={s.par_defaut === 1}
                    onChange={(v) => maj({ par_defaut: v })}
                  >
                    Présélectionner cette société dans le formulaire
                  </Case>
                </Section>

                <Section
                  titre="Modèle de courrier"
                  aide={
                    <>
                      Dans les phrases,{" "}
                      <code className="font-mono">{"{societe}"}</code>,{" "}
                      <code className="font-mono">{"{compte}"}</code>,{" "}
                      <code className="font-mono">{"{montant}"}</code> et{" "}
                      <code className="font-mono">{"{beneficiaire}"}</code> sont
                      remplacés à la génération.
                    </>
                  }
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FormField>
                      <FieldLabel htmlFor="so-police">Police</FieldLabel>
                      <ChoixSimple
                        id="so-police"
                        items={POLICE_ITEMS}
                        value={s.police}
                        onChange={(v) => maj({ police: v })}
                      />
                    </FormField>
                    <FormField>
                      <FieldLabel htmlFor="so-entete">En-tête</FieldLabel>
                      <ChoixSimple
                        id="so-entete"
                        items={ENTETE_ITEMS}
                        value={s.entete_mode}
                        onChange={(v) => maj({ entete_mode: v })}
                      />
                    </FormField>
                  </div>
                  {s.entete_mode === "texte" && (
                    <div className="flex flex-col gap-3 rounded-lg border border-border p-3">
                      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_8rem]">
                        {texte("entete_titre", "Titre de l'en-tête")}
                        <FormField>
                          <FieldLabel htmlFor="so-taille">
                            Taille (pt)
                          </FieldLabel>
                          <Input
                            id="so-taille"
                            type="number"
                            min={8}
                            max={48}
                            value={s.entete_taille}
                            onChange={(e) =>
                              maj({
                                entete_taille: Number(e.target.value),
                              })
                            }
                          />
                        </FormField>
                      </div>
                      {texte("entete_sous_titre", "Sous-titre")}
                      {texte("entete_droite", "Bloc de droite", {
                        rows: 3,
                        placeholder: "Adresse, téléphone, e-mail…",
                      })}
                    </div>
                  )}
                  <Case
                    checked={s.entete_filet === 1}
                    onChange={(v) => maj({ entete_filet: v })}
                  >
                    Trait horizontal sous l'en-tête
                  </Case>
                  {champ("objet", "Objet")}
                  {texte(
                    "phrase_corps",
                    "Phrase du corps — règlement fournisseur",
                    { rows: 3 },
                  )}
                  {champ(
                    "phrase_ligne",
                    "Ligne par bénéficiaire — règlement fournisseur",
                  )}
                  {texte("phrase_corps_salaire", "Phrase du corps — salaire", {
                    rows: 3,
                  })}
                  {champ(
                    "phrase_ligne_salaire",
                    "Ligne par bénéficiaire — salaire",
                  )}
                  <p className="-mt-2 text-micro text-muted-foreground">
                    La civilité se tape avec le nom du bénéficiaire (« Monsieur
                    Othman DIOURI »), pour ne pas la figer dans le modèle.
                  </p>
                  {champ(
                    "signataire_gauche",
                    "Signataire de gauche (salaires uniquement)",
                    { placeholder: "Ex : {beneficiaire}" },
                  )}
                  {texte("pied_page", "Pied de page")}
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Case
                      checked={s.avec_cloture === 1}
                      onChange={(v) => maj({ avec_cloture: v })}
                    >
                      Formule de clôture
                    </Case>
                    <Case
                      checked={s.salutation_grasse === 1}
                      onChange={(v) => maj({ salutation_grasse: v })}
                    >
                      « Madame, Monsieur, » en gras
                    </Case>
                    <Case
                      checked={s.societe_grasse === 1}
                      onChange={(v) => maj({ societe_grasse: v })}
                    >
                      Nom de la société en gras
                    </Case>
                    <Case
                      checked={s.montants_gras === 1}
                      onChange={(v) => maj({ montants_gras: v })}
                    >
                      Montants, compte et RIB en gras
                    </Case>
                    <Case
                      checked={s.beneficiaire_gras === 1}
                      onChange={(v) => maj({ beneficiaire_gras: v })}
                    >
                      Nom du bénéficiaire en gras
                    </Case>
                  </div>
                </Section>
              </FieldGroup>

              <div className="flex flex-col gap-2 lg:sticky lg:top-0">
                <ChoixSimple
                  items={APERCU_ITEMS}
                  value={apercu}
                  onChange={setApercu}
                />
                <div className="rounded-lg bg-muted/60 p-3">
                  <ApercuCourrier
                    societe={societeApercu}
                    type={apercu}
                    lignes={[LIGNE_EXEMPLE[apercu]]}
                    date={todayISO()}
                    logoSrc={logoApercu}
                  />
                </div>
              </div>
            </div>

            {erreur && (
              <p role="alert" className="mt-3 text-body text-destructive">
                {erreur}
              </p>
            )}
            <DialogFooter className="mt-5">
              <Button type="button" variant="outline" onClick={fermer}>
                Annuler
              </Button>
              <Button type="submit" disabled={enCours}>
                {enCours ? "Enregistrement…" : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
          {confirmation}
        </>
      )}
    </ModaleSaisie>
  );
}
