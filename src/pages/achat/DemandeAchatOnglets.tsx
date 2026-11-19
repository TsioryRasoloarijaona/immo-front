import { useState } from 'react';
import SearchableSelect from '../../components/SearchableSelect';
import Champ from '../../components/dossier/echeancier/Champ';
import { Input } from '../../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Textarea } from '../../components/ui/textarea';
import { getFournisseursDemandeAchat, getOffresDemandeAchat } from '../../lib/apiDemandesAchat';
import { formatCurrency } from '../../lib/format';
import { useApi } from '../../lib/useApi';
import type { DatesDemandeAchat, DemandeAchatFiche } from '../../types/demandesAchat';
import { lire, MESSAGE_ACCES_REFUSE } from '../commissions/lecture';
import OngletBonsCommandeDemandeAchat from './OngletBonsCommandeDemandeAchat';
import OngletBordereauDemandeAchat from './OngletBordereauDemandeAchat';
import OngletModalitesDemandeAchat from './OngletModalitesDemandeAchat';
import OngletOffresDemandeAchat from './OngletOffresDemandeAchat';
import OngletPreselectionDemandeAchat from './OngletPreselectionDemandeAchat';
import { DATES, type CleSaisie, type Listes, type Saisie } from './saisieDemandeAchat';

type Choix = Listes['procedures'];

function Erreur({ texte }: Readonly<{ texte?: string }>) {
  return texte ? <p role="alert" className="text-micro text-destructive">{texte}</p> : null;
}

function Liste({ id, libelle, items, valeur, onChange, disabled, erreur }: Readonly<{
  id: string; libelle: string; items: Choix; valeur: string; onChange: (v: string) => void; disabled: boolean; erreur?: string;
}>) {
  return (
    <Champ id={id} libelle={libelle}>
      <SearchableSelect id={id} items={items} value={valeur || null} placeholder="Choisir…" emptyMessage="Aucun choix" disabled={disabled}
        className="w-full min-w-0" onValueChange={(v) => onChange(v ?? '')} />
      <Erreur texte={erreur} />
    </Champ>
  );
}

function Saisir({ id, libelle, valeur, onChange, disabled, type, erreur }: Readonly<{
  id: string; libelle: string; valeur: string; onChange: (v: string) => void; disabled: boolean; type?: string; erreur?: string;
}>) {
  return (
    <Champ id={id} libelle={libelle}>
      <Input id={id} type={type} value={valeur} disabled={disabled} onChange={(e) => onChange(e.target.value)} aria-invalid={erreur ? true : undefined} />
      <Erreur texte={erreur} />
    </Champ>
  );
}

function Zone({ id, libelle, valeur, onChange, disabled }: Readonly<{ id: string; libelle: string; valeur: string; onChange: (v: string) => void; disabled: boolean }>) {
  return (
    <div className="col-span-full">
      <Champ id={id} libelle={libelle}>
        <Textarea id={id} rows={3} value={valeur} disabled={disabled} onChange={(e) => onChange(e.target.value)} />
      </Champ>
    </div>
  );
}

/** Onglets Principal, Modalités-dates et Autres ; tout est verrouillé si la demande n'est pas la dernière. */
export default function DemandeAchatOnglets({ fiche, saisie, maj, majDate, listes, erreurs }: Readonly<{
  fiche: DemandeAchatFiche | null;
  saisie: Saisie;
  maj: (cle: CleSaisie) => (v: string) => void;
  majDate: (cle: keyof DatesDemandeAchat) => (v: string) => void;
  listes: Listes;
  erreurs: Partial<Record<CleSaisie, string>>;
}>) {
  const verrou = fiche?.estDerniere === false;
  const [onglet, setOnglet] = useState('principal');
  const id = fiche?.id;
  // Demande confidentielle : un 403 sur la route d'un onglet le masque.
  const sondePresel = useApi(() => (id && fiche.confidentielle ? lire(() => getFournisseursDemandeAchat(id)) : Promise.resolve(null)), [id]);
  const sondeOffres = useApi(() => (id && fiche.confidentielle ? lire(() => getOffresDemandeAchat(id)) : Promise.resolve(null)), [id]);
  const sansPresel = sondePresel.error === MESSAGE_ACCES_REFUSE;
  const sansOffres = sondeOffres.error === MESSAGE_ACCES_REFUSE;
  const avecBons = fiche !== null && (fiche.lotMultiFournisseur || !fiche.lot);
  return (
    <Tabs value={onglet} onValueChange={setOnglet} className="min-h-0">
      <TabsList>
        <TabsTrigger value="principal">Principal</TabsTrigger>
        <TabsTrigger value="modalites">Modalités-dates</TabsTrigger>
        <TabsTrigger value="autres">Autres</TabsTrigger>
        {fiche && !sansPresel && <TabsTrigger value="presel">Présélection</TabsTrigger>}
        {fiche && !sansOffres && <TabsTrigger value="offres">Offres</TabsTrigger>}
        {fiche && <TabsTrigger value="paiement">Modalités de paiement</TabsTrigger>}
        {fiche && avecBons && <TabsTrigger value="bons">Bons de commande</TabsTrigger>}
        {fiche && <TabsTrigger value="bordereau">Bordereau</TabsTrigger>}
      </TabsList>
      {fiche && (
        <>
          <TabsContent value="presel"><OngletPreselectionDemandeAchat fiche={fiche} verrouille={verrou} /></TabsContent>
          <TabsContent value="offres"><OngletOffresDemandeAchat fiche={fiche} verrouille={verrou} /></TabsContent>
          <TabsContent value="paiement"><OngletModalitesDemandeAchat fiche={fiche} verrouille={verrou} /></TabsContent>
          <TabsContent value="bons"><OngletBonsCommandeDemandeAchat fiche={fiche} verrouille={verrou} /></TabsContent>
          <TabsContent value="bordereau"><OngletBordereauDemandeAchat fiche={fiche} verrouille={verrou} /></TabsContent>
        </>
      )}
      <TabsContent value="principal" className="grid grid-cols-2 gap-3 pt-3 lg:grid-cols-4">
        <Champ id="da-code" libelle="Code"><Input id="da-code" value={fiche?.code ?? ''} placeholder="Généré à l'enregistrement" disabled readOnly /></Champ>
        <Saisir id="da-date" libelle="Date" type="date" valeur={saisie.date} onChange={maj('date')} disabled={verrou} />
        <Liste id="da-procedure" libelle="Procédure *" items={listes.procedures} valeur={saisie.procedureId} onChange={maj('procedureId')}
          disabled={verrou || (fiche !== null && !fiche.procedureModifiable)} erreur={erreurs.procedureId} />
        <Liste id="da-societe" libelle="Société *" items={listes.societes} valeur={saisie.societeId} onChange={maj('societeId')} disabled={verrou} erreur={erreurs.societeId} />
        <Liste id="da-projet" libelle="Projet" items={listes.projets} valeur={saisie.projetId} onChange={maj('projetId')} disabled={verrou} />
        <Liste id="da-typelot" libelle="Type de lot" items={listes.typesLot} valeur={saisie.typeLotId} onChange={maj('typeLotId')} disabled={verrou} />
        <Liste id="da-module" libelle="Module" items={listes.modules} valeur={saisie.moduleId} onChange={maj('moduleId')} disabled={verrou} />
        <Champ id="da-statut" libelle="Statut"><Input id="da-statut" value={fiche?.statut?.libelle ?? ''} disabled readOnly /></Champ>
        <div className="col-span-full">
          <Saisir id="da-description" libelle="Description *" valeur={saisie.description} onChange={maj('description')} disabled={verrou} erreur={erreurs.description} />
        </div>
        <Zone id="da-longue" libelle="Description détaillée" valeur={saisie.descriptionLongue} onChange={maj('descriptionLongue')} disabled={verrou} />
      </TabsContent>
      <TabsContent value="modalites" className="grid grid-cols-2 gap-3 pt-3 lg:grid-cols-4">
        <Saisir id="da-ht" libelle="Prix estimé HT" type="number" valeur={saisie.prixEstimeHT} onChange={maj('prixEstimeHT')} disabled={verrou} />
        <Saisir id="da-tva" libelle="TVA par défaut (%)" type="number" valeur={saisie.tvaDefaut} onChange={maj('tvaDefaut')} disabled={verrou} />
        <Saisir id="da-ttc" libelle="Prix estimé TTC" type="number" valeur={saisie.prixEstimeTTC} onChange={maj('prixEstimeTTC')} disabled={verrou} />
        <Saisir id="da-delai" libelle="Délai de paiement (jours)" type="number" valeur={saisie.delaiPaiement} onChange={maj('delaiPaiement')} disabled={verrou} />
        {fiche && (
          <p className="col-span-full text-body text-muted-foreground">
            Montant enregistré : {formatCurrency(fiche.prixEstimeHT)} HT, {formatCurrency(fiche.prixEstimeTTC)} TTC.
          </p>
        )}
        {DATES.map((d) => (
          <Saisir key={d.cle} id={`da-${d.cle}`} libelle={d.libelle} type="date" valeur={saisie.dates[d.cle]} onChange={majDate(d.cle)} disabled={verrou} />
        ))}
      </TabsContent>
      <TabsContent value="autres" className="grid grid-cols-2 gap-3 pt-3">
        <Zone id="da-notes" libelle="Notes" valeur={saisie.notes} onChange={maj('notes')} disabled={verrou} />
        <Zone id="da-lettre" libelle="Texte de la lettre" valeur={saisie.texteLettre} onChange={maj('texteLettre')} disabled={verrou} />
      </TabsContent>
    </Tabs>
  );
}
