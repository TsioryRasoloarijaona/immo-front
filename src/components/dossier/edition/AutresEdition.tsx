import { useState, type ReactNode } from 'react';
import { FieldGrid } from '../../ui';
import { ChampCase, ChampDate, ChampListe, ChampTexte } from './ChampsSaisie';
import RechercheClient from './RechercheClient';
import { useTiersParType, type CleEdition, type FormulaireEdition } from '../../../lib/editionDossier';
import { commercialLabel, useAppData } from '../../../lib/appData';
import { referentielItems, useBanques } from '../../../lib/referentiels';
import type { ReferentielItemDto } from '../../../types';

const CASES: { cle: CleEdition; libelle: string; groupe: 'OPTIONS' | 'PENALITES' | 'PRIX' }[] = [
  { cle: 'ancienClient', libelle: "C'est un ancien client", groupe: 'OPTIONS' },
  { cle: 'cadeauPlusTard', libelle: 'Client veut choisir le cadeau plus tard', groupe: 'OPTIONS' },
  { cle: 'integrerModificationsAuPrix', libelle: 'Intégrer les modifications au prix de vente', groupe: 'PRIX' },
  { cle: 'penalitesDesactivees', libelle: 'Pénalité désactivée', groupe: 'PENALITES' },
];

function Section({ titre, children }: Readonly<{ titre: string; children: ReactNode }>) {
  return (
    <section>
      <h3 className="mb-2 text-micro font-medium text-muted-foreground">{titre}</h3>
      <FieldGrid>{children}</FieldGrid>
    </section>
  );
}

/** Formulaire de l'onglet « Autres » : chaque champ n'apparaît que si le rôle peut modifier son groupe. */
export default function AutresEdition({
  f,
  decisions,
  commercialActuelId,
}: Readonly<{ f: FormulaireEdition; decisions: ReferentielItemDto[]; commercialActuelId?: string | null }>) {
  const peut = f.edition.peut;
  const employes = useTiersParType('EMP', peut('GESTIONNAIRES'));
  // Le serveur n'accepte qu'un tiers de GET /api/commerciaux : même liste que les autres écrans.
  const { commerciaux, commerciauxLoading } = useAppData();
  const choixCommerciaux = commerciaux.map((c) => ({ label: commercialLabel(c), value: c.id }));
  // Un dossier peut porter un tiers d'un autre genre (DSI, DGD…) : il reste affiché, et n'est renvoyé que s'il change.
  if (commercialActuelId && !choixCommerciaux.some((c) => c.value === commercialActuelId)) {
    choixCommerciaux.unshift({ label: 'Commercial actuel (hors liste des commerciaux)', value: commercialActuelId });
  }
  const fournisseurs = useTiersParType('FOU', peut('NOTAIRE'));
  const banques = useBanques();
  const [client, setClient] = useState<{ id: string; nom: string } | null>(null);
  const liste = (cle: CleEdition, libelle: string, items: { label: string; value: string }[], chargement = false) => (
    <ChampListe label={libelle} items={items} value={f.texte(cle)} onChange={(v) => f.changer(cle, v)} chargement={chargement} />
  );

  return (
    <>
      {(peut('CLIENT') || peut('COMMERCIAL')) && (
        <Section titre="Acteurs">
          {peut('CLIENT') && (
            <RechercheClient
              choisi={client}
              onChoisir={(t) => {
                setClient(t);
                f.changer('clientId', t?.id ?? '');
              }}
            />
          )}
          {peut('COMMERCIAL') && liste('commercialId', 'Commercial', choixCommerciaux, commerciauxLoading)}
        </Section>
      )}
      {(peut('GESTIONNAIRES') || peut('NOTAIRE')) && (
        <Section titre="Gestion">
          {peut('GESTIONNAIRES') && liste('gestionnaire1Id', 'Gestionnaire 1', employes.items, employes.chargement)}
          {peut('GESTIONNAIRES') && liste('gestionnaire2Id', 'Gestionnaire 2', employes.items, employes.chargement)}
          {peut('NOTAIRE') && liste('notaireId', 'Notaire / avocat', fournisseurs.items, fournisseurs.chargement)}
        </Section>
      )}
      {peut('CREDIT') && (
        <Section titre="Crédit et MEILLEURTAUX">
          {liste('banqueCreditId', 'Banque crédit / leasing', referentielItems(banques.data), banques.loading)}
          <ChampTexte label="Agence de crédit" value={f.texte('agenceCredit')} maxLength={255} onChange={(v) => f.changer('agenceCredit', v)} />
          <ChampDate label="Envoi MEILLEURTAUX" value={f.texte('meilleurTauxEnvoi')} onChange={(v) => f.changer('meilleurTauxEnvoi', v)} />
          {liste('meilleurTauxDecisionId', 'Décision MEILLEURTAUX', referentielItems(decisions))}
          <ChampDate
            label="Date décision MEILLEURTAUX"
            value={f.texte('meilleurTauxDecisionDate')}
            onChange={(v) => f.changer('meilleurTauxDecisionDate', v)}
          />
        </Section>
      )}
      {CASES.some((c) => peut(c.groupe)) && (
        <Section titre="Options">
          {CASES.filter((c) => peut(c.groupe)).map((c) => (
            <ChampCase key={c.cle} label={c.libelle} checked={f.saisi[c.cle] === true} onChange={(v) => f.changer(c.cle, v)} />
          ))}
        </Section>
      )}
      {peut('NOTE') && (
        <FieldGrid>
          <ChampTexte label="Note (enregistrée aussi en action)" value={f.texte('note')} maxLength={1000} multiligne onChange={(v) => f.changer('note', v)} />
        </FieldGrid>
      )}
    </>
  );
}
