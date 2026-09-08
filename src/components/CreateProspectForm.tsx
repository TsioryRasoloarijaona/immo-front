import { useState } from 'react';
import Modal from './Modal';
import TelephoneField, { INDICATIF_MAROC } from './TelephoneField';
import type { CreerProspectRequest, ProspectionDetailDto } from '../types';
import { Button } from './ui/button';
import { DialogFooter } from './ui/dialog';
import { Field as FormField, FieldGroup, FieldLabel } from './ui/field';
import { Input } from './ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { creerProspectFromPreProspection, getTierKindsForType } from '../lib/api';
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
}: {
  id: string;
  label: string;
  value: string | null;
  onChange: (v: string | null) => void;
  items: { label: string; value: string }[];
  disabled?: boolean;
}) {
  const allItems = [{ label: '— Non renseigné —', value: '' }, ...items];
  return (
    <FormField>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select
        items={allItems}
        value={value ?? ''}
        onValueChange={(v) => onChange((v as string) || null)}
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

// The étape intermédiaire between a raw Pré-Prospection and a qualified
// Prospection — maps to POST /api/pre-prospections/{id}/creer-prospect.
// Field set mirrors the real Omran "Prospect : Général" screen
// (omaran_visual/prospect-creation.png) now that the référentiels needed to
// drive it (titres, sexes, pays, nationalités, situations familiales, types
// de résidence, régimes matrimoniaux, salaires, tier types/kinds, types de
// pièce d'identité) are exposed by the API.
export default function CreateProspectForm({
  preProspectionId,
  initial,
  onClose,
  onSubmit,
}: {
  preProspectionId: string;
  initial?: CreateProspectInitial;
  onClose: () => void;
  onSubmit: (updated: ProspectionDetailDto) => void;
}) {
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prenom.trim() || !nom.trim() || !telephone.trim()) return;
    const body: CreerProspectRequest = {
      prenom: prenom.trim(),
      nom: nom.trim(),
      telephone: telephone.trim(),
      // L'indicatif n'accompagne le numéro que si celui-ci existe : l'envoyer
      // seul décrirait un correspondant qu'on ne sait pas joindre.
      indicatifTelephone: telephone.trim() ? indicatifTelephone ?? undefined : undefined,
      mobile: mobile.trim() || undefined,
      indicatifMobile: mobile.trim() ? indicatifMobile ?? undefined : undefined,
      email: email.trim() || undefined,
      ville: ville.trim() || undefined,
      adresse: adresse.trim() || undefined,
      codePostal: codePostal.trim() || undefined,
      // These 3 are `format: date-time` on the backend — a bare
      // "YYYY-MM-DD" from the date inputs 400s, so pad to midnight ISO.
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
    setSubmitting(true);
    setError(null);
    try {
      const updated = await creerProspectFromPreProspection(preProspectionId, body);
      onSubmit(updated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec de la création.');
    } finally {
      setSubmitting(false);
    }
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

        {error && <p className="mt-3 text-body text-destructive">{error}</p>}

        <DialogFooter className="mt-5">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>Annuler</Button>
          <Button type="submit" disabled={submitting}>{submitting ? 'Création…' : 'Créer'}</Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}
