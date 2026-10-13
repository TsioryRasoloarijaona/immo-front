import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Inbox, Sun } from 'lucide-react';
import PageShell from '../../components/PageShell';
import RefSelect from '../../components/RefSelect';
import InteractionForm from '../../components/InteractionForm';
import BlocJournee from '../../components/parcours/BlocJournee';
import { LigneLead, LigneRelance } from '../../components/parcours/LignesJournee';
import FicheProspectionLazy, { type FicheOuverte } from '../../components/dashboard/FicheProspectionLazy';
import { ErrorState, LoadingState } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { addInteraction, getJournee } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { useAuth } from '../../lib/auth';
import { useAppData, commercialLabel } from '../../lib/appData';
import { estChefOuExempte } from '../../lib/roles';
import { formatNumber, pluriel } from '../../lib/format';
import { useTypesContactProspection } from '../../lib/referentiels';
import { typeActionDuCanal, type CanalContact } from '../../lib/contact';
import { useToast } from '../../lib/toastContext';
import type { JourneeDto, RelanceJourneeDto } from '../../types';

function bandeau(j: JourneeDto): string {
  return [
    pluriel(j.nouveauxLeads.total, 'lead') + ' à trier',
    pluriel(j.relancesDuJour.total, 'appel'),
    pluriel(j.visitesDuJour.total, 'visite'),
    `${formatNumber(j.enRetard.total)} en retard`,
  ].join(' · ');
}

/** « Ma journée » : la page d'accueil du commercial (FEATURE-parcours-commercial.md §4). */
export default function MaJournee() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { commerciaux } = useAppData();
  const showToast = useToast();
  const types = useTypesContactProspection();
  const [commercialId, setCommercialId] = useState<string | null>(null);
  // Échange à noter : « Visite faite », ou retour d'un clic Appeler / WhatsApp (type d'action présélectionné).
  const [echange, setEchange] = useState<{ relance: RelanceJourneeDto; typeId?: string; confirmation: string } | null>(null);
  const [fiche, setFiche] = useState<FicheOuverte | null>(null);
  const chef = estChefOuExempte(user);

  const journee = useApi(() => getJournee(commercialId ?? undefined), [commercialId], 'journee');
  const typeVisite = types.data.find((t) => (t.code ?? '').trim().toLowerCase() === 'visite')?.id;
  const j = journee.data;
  const apresContact = (relance: RelanceJourneeDto, canal: CanalContact) =>
    setEchange({ relance, typeId: typeActionDuCanal(types.data, canal), confirmation: 'Échange noté.' });

  return (
    <PageShell
      title="Ma journée"
      crumbs={[{ label: 'Ma journée' }]}
      icon={<Sun />}
      accent="var(--sec-accent)"
      accentBg="var(--sec-accent-bg)"
    >
      <div className="flex flex-col gap-3 pt-1">
        {chef && (
          <div className="w-full sm:w-72">
            <RefSelect
              id="journee-commercial"
              label="Commercial"
              value={commercialId}
              onChange={setCommercialId}
              items={commerciaux.map((c) => ({ label: commercialLabel(c), value: c.id }))}
              placeholder="Mes lignes"
            />
          </div>
        )}
        {journee.error && <ErrorState message={journee.error} />}
        {!journee.error && !j && <LoadingState />}
        {!journee.error && j && (
          <>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-xl border border-border bg-card px-4 py-3">
              <span className="text-title font-semibold text-foreground">Bonjour {j.prenom ?? user?.description ?? ''}</span>
              <span className="text-body text-muted-foreground">{bandeau(j)}</span>
            </div>
            {!j.commercialId && (
              <p className="text-body text-muted-foreground">Votre compte n'est rattaché à aucun commercial : aucune ligne à afficher.</p>
            )}
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <BlocJournee
                titre="À faire maintenant"
                sousTitre="nouveaux leads à rappeler"
                total={j.nouveauxLeads.total}
                affichees={j.nouveauxLeads.lignes.length}
                vide="Aucun nouveau lead : tout est trié."
                pied={
                  <>
                    <span className="text-micro text-muted-foreground">Plus un lead attend, moins il répond.</span>
                    <Button type="button" size="sm" onClick={() => navigate('/tri')}>
                      <Inbox data-icon="inline-start" /> Trier ({formatNumber(j.nouveauxLeads.total)})
                    </Button>
                  </>
                }
              >
                {j.nouveauxLeads.lignes.map((l) => <LigneLead key={l.prospectionId} lead={l} onOuvrir={setFiche} />)}
              </BlocJournee>
              <BlocJournee titre="Appels et relances du jour" total={j.relancesDuJour.total} affichees={j.relancesDuJour.lignes.length} vide="Aucune relance prévue aujourd'hui.">
                {j.relancesDuJour.lignes.map((r) => <LigneRelance key={r.interactionId} relance={r} onOuvrir={setFiche} onContact={apresContact} />)}
              </BlocJournee>
              <BlocJournee titre="Visites du jour" total={j.visitesDuJour.total} affichees={j.visitesDuJour.lignes.length} vide="Aucune visite prévue aujourd'hui.">
                {j.visitesDuJour.lignes.map((r) => (
                  <LigneRelance
                    key={r.interactionId}
                    relance={r}
                    onOuvrir={setFiche}
                    action={
                      <Button type="button" size="sm" variant="outline" disabled={!typeVisite} onClick={() => setEchange({ relance: r, typeId: typeVisite, confirmation: 'Visite notée.' })}>
                        <Check data-icon="inline-start" /> Visite faite
                      </Button>
                    }
                  />
                ))}
              </BlocJournee>
              <BlocJournee titre="En retard" alerte total={j.enRetard.total} affichees={j.enRetard.lignes.length} vide="Rien en retard.">
                {j.enRetard.lignes.map((r) => <LigneRelance key={r.interactionId} relance={r} onOuvrir={setFiche} onContact={apresContact} retard />)}
              </BlocJournee>
            </div>
          </>
        )}
      </div>
      {/* À la fermeture, relire la journée : une action notée dans la fiche peut déplacer la ligne. */}
      <FicheProspectionLazy
        fiche={fiche}
        onClose={() => {
          setFiche(null);
          void journee.refetch();
        }}
      />
      {echange && (
        <InteractionForm
          initialActionTypeId={echange.typeId}
          onClose={() => setEchange(null)}
          onSubmit={async (input) => {
            await addInteraction(echange.relance.prospectionId, input);
            await journee.refetch();
            showToast(echange.confirmation);
          }}
        />
      )}
    </PageShell>
  );
}
