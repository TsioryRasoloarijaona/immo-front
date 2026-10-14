import { useState, type ReactNode } from 'react';
import { FieldGrid } from '../../ui';
import { ChampCase, ChampDate, ChampListe, ChampTexte } from './ChampsSaisie';
import RechercheClient from './RechercheClient';
import { useTiersParType, type CleEdition, type FormulaireEdition } from '../../../lib/editionDossier';
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
}: Readonly<{ f: FormulaireEdition; decisions: ReferentielItemDto[] }>) {
  const peut = f.edition.peut;
  const employes = useTiersParType('EMP', peut('GESTIONNAIRES') || peut('COMMERCIAL'));
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
          {peut('COMMERCIAL') && liste('commercialId', 'Changer le commercial', employes.items, employes.chargement)}
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
