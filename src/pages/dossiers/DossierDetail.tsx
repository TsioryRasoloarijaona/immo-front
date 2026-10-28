import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowUpRight, BellDot, Folder, Phone } from 'lucide-react';
import CadreFiche, { EnteteFiche, type VarianteFiche } from '../../components/CadreFiche';
import { Badge, ErrorState, LoadingState } from '../../components/ui';
import FicheShell from '../../components/FicheShell';
import { Button } from '../../components/ui/button';
import ActionsFicheDossier from '../../components/dossier/ActionsFicheDossier';
import BandeauxDossier from '../../components/dossier/BandeauxDossier';
import FormulaireDossier from '../../components/dossier/FormulaireDossier';
import PanneauDossier from '../../components/dossier/PanneauDossier';
import MessageCreation from '../../components/dossier/fiche/MessageCreation';
import useFicheDossier from '../../components/dossier/fiche/useFicheDossier';
import ongletsDossier from '../../components/dossier/fiche/ongletsDossier';
import OngletAnnulation from '../../components/dossier/onglets/OngletAnnulation';
import OngletAutres from '../../components/dossier/onglets/OngletAutres';
import OngletAutresMontants from '../../components/dossier/onglets/OngletAutresMontants';
import OngletDates from '../../components/dossier/onglets/OngletDates';
import OngletDatesAutres from '../../components/dossier/onglets/OngletDatesAutres';
import { formatDate, formatPercent } from '../../lib/format';
import { canonicalStatusLabel, toneForStatus } from '../../lib/dossierStatus';
import { useToast } from '../../lib/toastContext';
import { usePreview } from '../../lib/previewContext';
import type { DossierDetailDto, DossierFicheDto } from '../../types';

function EnteteDossier({
  dossier: d,
  fiche,
  sorti,
}: Readonly<{ dossier: DossierDetailDto; fiche: DossierFicheDto | null; sorti: boolean }>) {
  return (
    <EnteteFiche
      code={d.code}
      nom={
        d.clientId ? (
          <Link to={`/clients/${d.clientId}`} className="hover:underline" title="Ouvrir la fiche client">
            {d.clientNom || 'Voir le client'}
          </Link>
        ) : (
          d.clientNom || d.code || 'Dossier'
        )
      }
    >
      <Badge tone={toneForStatus(d.statut)}>{canonicalStatusLabel(d.statut) || '—'}</Badge>
      {d.dateValiditeStatut && (
        <span className={fiche?.statut.expire ? 'text-micro font-medium text-(--warning)' : 'text-micro text-muted-foreground'}>
          {fiche?.statut.expire ? 'expiré depuis le' : "valide jusqu'au"} {formatDate(d.dateValiditeStatut)}
        </span>
      )}
      {sorti && <Badge tone="warning">Dossier sorti</Badge>}
      {fiche?.instructionNonLue && <BellDot aria-label="Instruction non lue" className="size-4 text-(--info)" />}
      {/* Fraction (1 = 100 %) : ne s'affiche qu'en indivision. */}
      {typeof d.quotePart === 'number' && d.quotePart !== 1 && (
        <span className="text-micro font-medium text-foreground">Quote-part {formatPercent(d.quotePart, 2)}</span>
      )}
    </EnteteFiche>
  );
}

/** `?onglet=financier` ouvre l'échéancier (lien de la liste des impayés) ; en dialogue, l'URL est celle de derrière. */
function ongletInitial(variante: VarianteFiche, onglet: string | null): string {
  return variante === 'page' && onglet === 'financier' ? 'financier' : 'statut';
}

export function FicheDossier({
  id,
  variante = 'page',
  onglet,
}: Readonly<{ id: string; variante?: VarianteFiche; onglet?: string }>) {
  const f = useFicheDossier(id);
  const { dossier: d, fiche, montants, echeances } = f;
  const navigate = useNavigate();
  const showToast = useToast();
  const [searchParams] = useSearchParams();
  // En dialogue, l'URL est celle de la page derrière : `?nouveau` ne la concerne pas.
  const fromCreation = variante === 'page' && searchParams.get('nouveau') === '1';
  const [tab, setTab] = useState(() => onglet ?? ongletInitial(variante, searchParams.get('onglet')));
  const { ouvrirFicheProspection } = usePreview();

  // `!d.data` : avec une valeur en cache, on repeint le dossier connu et la revalidation se fait en fond.
  if (d.loading && !d.data) return <CadreFiche variante={variante} title="Dossier de vente"><LoadingState /></CadreFiche>;
  if (d.error) return <CadreFiche variante={variante} title="Dossier de vente"><ErrorState message={d.error} /></CadreFiche>;
  const dossier = d.data;
  if (!dossier) {
    return (
      <CadreFiche variante={variante} title="Dossier introuvable" crumbs={[{ label: 'Dossiers', to: '/dossiers' }]}>
        <p>Ce dossier n'existe pas.</p>
      </CadreFiche>
    );
  }

  const echeancesVides = echeances.data?.totalElements === 0;
  const o = ongletsDossier(f, dossier, fromCreation);

  return (
    <CadreFiche
      variante={variante}
      title={dossier.clientNom || dossier.code || 'Dossier'}
      crumbs={[{ label: 'Dossiers', to: '/dossiers' }]}
      typeFiche="Dossier de vente"
      fullHeight
      icon={<Folder />}
      accent="var(--sec-dossier)"
      accentBg="var(--sec-dossier-bg)"
      entete={<EnteteDossier dossier={dossier} fiche={fiche.data} sorti={!!montants.data?.dossierSorti} />}
      actions={
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <ActionsFicheDossier dossierId={dossier.id} commercialNom={dossier.commercialNom} onChanged={() => void f.relireTout()} />
          <Button variant="outline" size="sm" onClick={() => showToast('Intégration VOIP à venir.')}>
            <Phone data-icon="inline-start" /> Appeler
          </Button>
          {dossier.prospectionId && (
            <Button variant="outline" size="sm" onClick={() => dossier.prospectionId && ouvrirFicheProspection(dossier.prospectionId, false)}>
              <ArrowUpRight data-icon="inline-start" /> Prospection
            </Button>
          )}
          {dossier.clientId && (
            <Button variant="outline" size="sm" onClick={() => navigate(`/clients/${dossier.clientId}`)}>
              <ArrowUpRight data-icon="inline-start" /> Fiche client
            </Button>
          )}
        </div>
      }
    >
      <FicheShell
        ongletActif={tab}
        onOngletChange={setTab}
        identite={
          <div className="flex flex-col gap-1.5">
            <BandeauxDossier fiche={fiche.data} />
            {fromCreation && !echeances.error && echeances.data && <MessageCreation vide={echeancesVides} />}
          </div>
        }
        /* Lecture seule : les champs se modifient dans un autre lot ; ici statut, échéancier et actions. */
        formulaire={<FormulaireDossier dossier={dossier} enTete={fiche.data?.enTete} />}
        panneau={<PanneauDossier dossier={dossier} montants={montants} />}
        onglets={[
          o.statut,
          o.financier,
          { id: 'autres-montants', libelle: 'Autres montants', contenu: <OngletAutresMontants fiche={fiche} /> },
          { id: 'dates', libelle: 'Dates', contenu: <OngletDates fiche={fiche} /> },
          { id: 'dates-autres', libelle: 'Dates autres', contenu: <OngletDatesAutres fiche={fiche} /> },
          { id: 'annulation', libelle: 'Annulation / Résiliation', contenu: <OngletAnnulation fiche={fiche} dossierId={dossier.id} /> },
          { id: 'autres', libelle: 'Autres', contenu: <OngletAutres fiche={fiche} /> },
          o.articles,
          o.acquereurs,
          o.modifications,
          o.cadeaux,
          o.actions,
          o.pieces,
          o.documents,
          o.historique,
        ]}
      />
    </CadreFiche>
  );
}
