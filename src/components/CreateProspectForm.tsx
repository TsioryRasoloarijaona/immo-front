import { useState } from 'react';
import Modal from './Modal';
import TelephoneField, { INDICATIF_MAROC } from './TelephoneField';
import type { CreerProspectRequest, ProspectDoublonDto, ProspectionDetailDto, ProspectionExistanteDto } from '../types';
import DoublonsProspectPanel from './DoublonsProspectPanel';
import ProspectionExistanteNotice from './ProspectionExistanteNotice';
import { Button } from './ui/button';
import { DialogFooter } from './ui/dialog';
import { Field as FormField, FieldGroup, FieldLabel } from './ui/field';
import { Input } from './ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  creerProspectFromPreProspection,
  doublonsDepuisErreur,
  getTierKindsForType,
  lierProspectAPreProspection,
  prospectionExistanteDepuisErreur,
} from '../lib/api';
import { toApiDateTime } from '../lib/format';
import { useApi } from '../lib/useApi';
import {
  referentielItems,
  useNationalites,
  usePays,
  useRegimesMatrimoniaux,
  useSalaires,
  useSexes,
  useSituationsFamiliales,
  useTierTypes,
  useTitres,
  useTypesPieceIdentite,
  useTypesResidence,
} from '../lib/referentiels';

export interface CreateProspectInitial {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
}

function RefSelect({
  id,
  label,
  value,
  onChange,
  items,
  disabled,
}: Readonly<{
  id: string;
  label: string;
  value: string | null;
  onChange: (v: string | null) => void;
  items: { label: string; value: string }[];
  disabled?: boolean;
}>) {
  const allItems = [{ label: '— Non renseigné —', value: '' }, ...items];
  return (
    <FormField>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select
        items={allItems}
        value={value ?? ''}
        onValueChange={(v) => onChange((v) || null)}
        disabled={disabled}
      >
        <SelectTrigger id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {allItems.map((item) => (
              <SelectItem key={item.value || '__none'} value={item.value}>{item.label}</SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </FormField>
  );
}

export default function CreateProspectForm({
  preProspectionId,
  initial,
  onClose,
  onSubmit,
}: Readonly<{
  preProspectionId: string;
  initial?: CreateProspectInitial;
  onClose: () => void;
  onSubmit: (updated: ProspectionDetailDto, mode: 'cree' | 'rattache') => void;
}>) {
  const [prenom, setPrenom] = useState(initial?.firstName ?? '');
  const [nom, setNom] = useState(initial?.lastName ?? '');
  const [telephone, setTelephone] = useState(initial?.phone ?? '');
  const [indicatifTelephone, setIndicatifTelephone] = useState<string | null>(INDICATIF_MAROC);
  const [mobile, setMobile] = useState('');
  const [indicatifMobile, setIndicatifMobile] = useState<string | null>(INDICATIF_MAROC);
  const [email, setEmail] = useState(initial?.email ?? '');
  const [ville, setVille] = useState('');
  const [adresse, setAdresse] = useState('');
  const [codePostal, setCodePostal] = useState('');
  const [dateNaissance, setDateNaissance] = useState('');
  const [lieuNaissance, setLieuNaissance] = useState('');
  const [nombreEnfants, setNombreEnfants] = useState('');
  const [employeur, setEmployeur] = useState('');
  const [anciennete, setAnciennete] = useState('');
  const [filsDe, setFilsDe] = useState('');
  const [etDe, setEtDe] = useState('');

  const [titreId, setTitreId] = useState<string | null>(null);
  const [sexeId, setSexeId] = useState<string | null>(null);
  const [paysId, setPaysId] = useState<string | null>(null);
  const [paysResidenceId, setPaysResidenceId] = useState<string | null>(null);
  const [nationaliteId, setNationaliteId] = useState<string | null>(null);
  const [situationFamilialeId, setSituationFamilialeId] = useState<string | null>(null);
  const [typeResidenceId, setTypeResidenceId] = useState<string | null>(null);
  const [regimeMatrimonialId, setRegimeMatrimonialId] = useState<string | null>(null);
  const [salaireId, setSalaireId] = useState<string | null>(null);
  const [tierTypeId, setTierTypeId] = useState<string | null>(null);
  const [tierKindId, setTierKindId] = useState<string | null>(null);
  const [pieceTypeId, setPieceTypeId] = useState<string | null>(null);
  const [pieceNumero, setPieceNumero] = useState('');
  const [pieceDelivreeLe, setPieceDelivreeLe] = useState('');
  const [pieceLieuDelivrance, setPieceLieuDelivrance] = useState('');
  const [pieceValideJusquau, setPieceValideJusquau] = useState('');
  const [pieceLieuValidite, setPieceLieuValidite] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Un 409 `doublons` n'est pas une erreur : le serveur attend que l'utilisateur tranche.
  const [doublons, setDoublons] = useState<ProspectDoublonDto[] | null>(null);
  const [existante, setExistante] = useState<ProspectionExistanteDto | null>(null);

  const titres = useTitres();
  const sexes = useSexes();
  const pays = usePays();
  const nationalites = useNationalites();
  const situations = useSituationsFamiliales();
  const typesResidence = useTypesResidence();
  const regimes = useRegimesMatrimoniaux();
  const salaires = useSalaires();
  const tierTypes = useTierTypes();
  const typesPiece = useTypesPieceIdentite();
  const tierKinds = useApi(() => (tierTypeId ? getTierKindsForType(tierTypeId) : Promise.resolve([])), [tierTypeId]);

  const paysItems = pays.data.map((p) => ({ label: p.description || p.code || p.id, value: p.id }));

  function construireCorps(ignorerDoublons: boolean): CreerProspectRequest {
    return {
      ignorerDoublons: ignorerDoublons || undefined,
      prenom: prenom.trim(),
      nom: nom.trim(),
      telephone: telephone.trim(),
      // Jamais d'indicatif sans numéro : il décrirait un correspondant injoignable.
      indicatifTelephone: telephone.trim() ? indicatifTelephone ?? undefined : undefined,
      mobile: mobile.trim() || undefined,
      indicatifMobile: mobile.trim() ? indicatifMobile ?? undefined : undefined,
      email: email.trim() || undefined,
      ville: ville.trim() || undefined,
      adresse: adresse.trim() || undefined,
      codePostal: codePostal.trim() || undefined,
      // Ces 3 dates sont `date-time` côté backend : un « YYYY-MM-DD » nu y fait 400.
      dateNaissance: toApiDateTime(dateNaissance),
      lieuNaissance: lieuNaissance.trim() || undefined,
      nombreEnfants: nombreEnfants ? Number(nombreEnfants) : undefined,
      employeur: employeur.trim() || undefined,
      anciennete: anciennete ? Number(anciennete) : undefined,
      filsDe: filsDe.trim() || undefined,
      etDe: etDe.trim() || undefined,
      titreId: titreId ?? undefined,
      sexeId: sexeId ?? undefined,
      paysId: paysId ?? undefined,
      paysResidenceId: paysResidenceId ?? undefined,
      nationaliteId: nationaliteId ?? undefined,
      situationFamilialeId: situationFamilialeId ?? undefined,
      typeResidenceId: typeResidenceId ?? undefined,
      regimeMatrimonialId: regimeMatrimonialId ?? undefined,
      salaireId: salaireId ?? undefined,
      typeId: tierTypeId ?? undefined,
      kindId: tierKindId ?? undefined,
      pieceIdentite:
        pieceTypeId || pieceNumero
          ? {
              typeId: pieceTypeId ?? undefined,
              numero: pieceNumero.trim() || undefined,
              delivreeLe: toApiDateTime(pieceDelivreeLe),
              lieuDelivrance: pieceLieuDelivrance.trim() || undefined,
              valideJusquau: toApiDateTime(pieceValideJusquau),
              lieuValidite: pieceLieuValidite.trim() || undefined,
            }
          : undefined,
    };
  }

  async function envoyer(ignorerDoublons: boolean) {
    setSubmitting(true);
    setError(null);
    setExistante(null);
    try {
      const updated = await creerProspectFromPreProspection(preProspectionId, construireCorps(ignorerDoublons));
      onSubmit(updated, 'cree');
      onClose();
    } catch (err) {
      const trouves = doublonsDepuisErreur(err);
      if (trouves && trouves.length > 0) {
        setDoublons(trouves);
        return;
      }
      setDoublons(null);
      setError(err instanceof Error ? err.message : 'Échec de la création.');
    } finally {
      setSubmitting(false);
    }
  }

  async function rattacher(doublon: ProspectDoublonDto) {
    setSubmitting(true);
    setError(null);
    setExistante(null);
    try {
      const updated = await lierProspectAPreProspection(preProspectionId, { prospectId: doublon.id });
      onSubmit(updated, 'rattache');
      onClose();
    } catch (err) {
      const deja = prospectionExistanteDepuisErreur(err);
      if (deja) {
        setExistante(deja);
        setError(err instanceof Error ? err.message : null);
        return;
      }
      setError(err instanceof Error ? err.message : 'Échec du rattachement.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!prenom.trim() || !nom.trim() || !telephone.trim()) return;
    await envoyer(false);
  }

  return (
    <Modal title="Créer la fiche prospect" onClose={onClose} width={640}>
      <form onSubmit={handleSubmit}>
        {(initial?.firstName || initial?.phone) && (
          <p className="mb-3.5 text-xs text-muted-foreground">
            Identité et coordonnées pré-remplies depuis la pré-prospection — vérifiez et complétez avant de valider.
          </p>
        )}

        <div className="mb-1.5 text-micro font-semibold text-foreground">Identité & coordonnées</div>
        <FieldGroup>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            <RefSelect id="titre" label="Titre" value={titreId} onChange={setTitreId} items={referentielItems(titres.data)} />
            <RefSelect id="sexe" label="Sexe" value={sexeId} onChange={setSexeId} items={referentielItems(sexes.data)} />
            <FormField>
              <FieldLabel htmlFor="prenom">Prénom</FieldLabel>
              <Input id="prenom" value={prenom} onChange={(e) => setPrenom(e.target.value)} required />
            </FormField>
            <FormField>
              <FieldLabel htmlFor="nom">Nom</FieldLabel>
              <Input id="nom" value={nom} onChange={(e) => setNom(e.target.value)} required />
            </FormField>
            <FormField>
              <FieldLabel htmlFor="filsDe">Fils de</FieldLabel>
              <Input id="filsDe" value={filsDe} onChange={(e) => setFilsDe(e.target.value)} />
            </FormField>
            <FormField>
              <FieldLabel htmlFor="etDe">Et de</FieldLabel>
              <Input id="etDe" value={etDe} onChange={(e) => setEtDe(e.target.value)} />
            </FormField>
            <TelephoneField
              id="telephone"
              label="Téléphone"
              numero={telephone}
              indicatif={indicatifTelephone}
              onNumeroChange={setTelephone}
              onIndicatifChange={setIndicatifTelephone}
              required
            />
            <TelephoneField
              id="mobile"
              label="Mobile"
              numero={mobile}
              indicatif={indicatifMobile}
              onNumeroChange={setMobile}
              onIndicatifChange={setIndicatifMobile}
            />
            <FormField>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </FormField>
          </div>
        </FieldGroup>

        <div className="mt-4 mb-1.5 border-t border-border pt-4 text-micro font-semibold text-foreground">Résidence & nationalité</div>
        <FieldGroup>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            <FormField>
              <FieldLabel htmlFor="ville">Ville</FieldLabel>
              <Input id="ville" value={ville} onChange={(e) => setVille(e.target.value)} />
            </FormField>
            <FormField>
              <FieldLabel htmlFor="codePostal">Code postal</FieldLabel>
              <Input id="codePostal" value={codePostal} onChange={(e) => setCodePostal(e.target.value)} />
            </FormField>
            <FormField className="sm:col-span-2 lg:col-span-1">
              <FieldLabel htmlFor="adresse">Adresse</FieldLabel>
              <Input id="adresse" value={adresse} onChange={(e) => setAdresse(e.target.value)} />
            </FormField>
            <RefSelect id="pays" label="Pays" value={paysId} onChange={setPaysId} items={paysItems} />
            <RefSelect id="paysResidence" label="Pays de résidence" value={paysResidenceId} onChange={setPaysResidenceId} items={paysItems} />
            <RefSelect id="nationalite" label="Nationalité" value={nationaliteId} onChange={setNationaliteId} items={referentielItems(nationalites.data)} />
            <FormField>
              <FieldLabel htmlFor="dateNaissance">Date de naissance</FieldLabel>
              <Input id="dateNaissance" type="date" value={dateNaissance} onChange={(e) => setDateNaissance(e.target.value)} />
            </FormField>
            <FormField>
              <FieldLabel htmlFor="lieuNaissance">Lieu de naissance</FieldLabel>
              <Input id="lieuNaissance" value={lieuNaissance} onChange={(e) => setLieuNaissance(e.target.value)} />
            </FormField>
          </div>
        </FieldGroup>

        <div className="mt-4 mb-1.5 border-t border-border pt-4 text-micro font-semibold text-foreground">Situation & profession</div>
        <FieldGroup>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            <RefSelect id="situationFamiliale" label="Situation familiale" value={situationFamilialeId} onChange={setSituationFamilialeId} items={referentielItems(situations.data)} />
            <FormField>
              <FieldLabel htmlFor="nombreEnfants">Enfants</FieldLabel>
              <Input id="nombreEnfants" type="number" min={0} value={nombreEnfants} onChange={(e) => setNombreEnfants(e.target.value)} />
            </FormField>
            <RefSelect id="regimeMatrimonial" label="Régime matrimonial" value={regimeMatrimonialId} onChange={setRegimeMatrimonialId} items={referentielItems(regimes.data)} />
            <RefSelect id="typeResidence" label="Type de résidence" value={typeResidenceId} onChange={setTypeResidenceId} items={referentielItems(typesResidence.data)} />
            <RefSelect id="salaire" label="Salaire" value={salaireId} onChange={setSalaireId} items={referentielItems(salaires.data)} />
            <FormField>
              <FieldLabel htmlFor="employeur">Employeur</FieldLabel>
              <Input id="employeur" value={employeur} onChange={(e) => setEmployeur(e.target.value)} />
            </FormField>
            <FormField>
              <FieldLabel htmlFor="anciennete">Ancienneté (années)</FieldLabel>
              <Input id="anciennete" type="number" min={0} value={anciennete} onChange={(e) => setAnciennete(e.target.value)} />
            </FormField>
            <RefSelect id="tierType" label="Type de tiers" value={tierTypeId} onChange={(v) => { setTierTypeId(v); setTierKindId(null); }} items={referentielItems(tierTypes.data)} />
            <RefSelect id="tierKind" label="Nature du tiers" value={tierKindId} onChange={setTierKindId} items={referentielItems(tierKinds.data ?? [])} disabled={!tierTypeId} />
          </div>
        </FieldGroup>

        <div className="mt-4 mb-1.5 border-t border-border pt-4 text-micro font-semibold text-foreground">Pièce d'identité</div>
        <FieldGroup>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            <RefSelect id="pieceType" label="Type de pièce" value={pieceTypeId} onChange={setPieceTypeId} items={referentielItems(typesPiece.data)} />
            <FormField>
              <FieldLabel htmlFor="pieceNumero">Numéro</FieldLabel>
              <Input id="pieceNumero" value={pieceNumero} onChange={(e) => setPieceNumero(e.target.value)} />
            </FormField>
            <FormField>
              <FieldLabel htmlFor="pieceDelivreeLe">Délivrée le</FieldLabel>
              <Input id="pieceDelivreeLe" type="date" value={pieceDelivreeLe} onChange={(e) => setPieceDelivreeLe(e.target.value)} />
            </FormField>
            <FormField>
              <FieldLabel htmlFor="pieceLieuDelivrance">Lieu de délivrance</FieldLabel>
              <Input id="pieceLieuDelivrance" value={pieceLieuDelivrance} onChange={(e) => setPieceLieuDelivrance(e.target.value)} />
            </FormField>
            <FormField>
              <FieldLabel htmlFor="pieceValideJusquau">Valide jusqu'au</FieldLabel>
              <Input id="pieceValideJusquau" type="date" value={pieceValideJusquau} onChange={(e) => setPieceValideJusquau(e.target.value)} />
            </FormField>
            <FormField>
              <FieldLabel htmlFor="pieceLieuValidite">Lieu de validité</FieldLabel>
              <Input id="pieceLieuValidite" value={pieceLieuValidite} onChange={(e) => setPieceLieuValidite(e.target.value)} />
            </FormField>
          </div>
        </FieldGroup>

        {existante ? (
          <div className="mt-3">
            <ProspectionExistanteNotice existante={existante} message={error} onOuvrir={onClose} />
          </div>
        ) : (
          error && <p className="mt-3 text-body text-destructive">{error}</p>
        )}

        {doublons && doublons.length > 0 && (
          <div className="mt-3">
            <DoublonsProspectPanel
              doublons={doublons}
              libelleChoisir="Rattacher"
              busy={submitting}
              onChoisir={(d) => void rattacher(d)}
              onNouveauContact={() => void envoyer(true)}
            />
          </div>
        )}

        <DialogFooter className="mt-5">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>Annuler</Button>
          {/* Doublons affichés : Créer se retire, il ne ferait que reposer la même question. */}
          {!doublons && (
            <Button type="submit" disabled={submitting}>{submitting ? 'Création…' : 'Créer'}</Button>
          )}
        </DialogFooter>
      </form>
    </Modal>
  );
}
