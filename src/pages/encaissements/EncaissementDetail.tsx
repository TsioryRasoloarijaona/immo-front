import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Wallet } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { Badge, Card, ErrorState, Field, FieldGrid, LoadingState } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { getEncaissement } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { encaissementEtatLabel, encaissementEtatTone } from '../../lib/domain';
import { formatCurrency, formatDate } from '../../lib/format';

export default function EncaissementDetail() {
  const { id } = useParams();
  const { data: e, loading, error } = useApi(() => getEncaissement(id!), [id]);
  const navigate = useNavigate();

  if (loading) return <PageShell title="Encaissement"><LoadingState /></PageShell>;
  if (error) {
    return (
      <PageShell title="Encaissement" crumbs={[{ label: 'Ventes' }, { label: 'Encaissements', to: '/encaissements' }]}>
        <ErrorState message={error} />
      </PageShell>
    );
  }
  if (!e) {
    return (
      <PageShell title="Encaissement introuvable" crumbs={[{ label: 'Ventes' }, { label: 'Encaissements', to: '/encaissements' }]}>
        <p>Ce règlement n'existe pas.</p>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={e.reference || 'Règlement'}
      crumbs={[
        { label: 'Ventes' },
        { label: 'Encaissements', to: '/encaissements' },
        { label: e.reference || '' },
      ]}
      icon={<Wallet />}
      accent="var(--sec-dossier)"
      accentBg="var(--sec-dossier-bg)"
    >
      <Button variant="outline" size="sm" className="mb-3" onClick={() => navigate('/encaissements')}>
        <ArrowLeft data-icon="inline-start" /> Retour à la liste
      </Button>

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h2 className="text-hero font-semibold tracking-tight text-foreground">{e.reference || 'Règlement'}</h2>
        <Badge tone={encaissementEtatTone(e.etat)}>{encaissementEtatLabel(e.etat)}</Badge>
        <Badge tone={e.comptabilise ? 'success' : 'neutral'}>{e.comptabilise ? 'Comptabilisé' : 'Non comptabilisé'}</Badge>
      </div>

      <div className="flex flex-col gap-3">
        <Card title="Détails" accent="var(--sec-dossier)">
          <FieldGrid>
            <Field label="Tiers réglant" value={e.tierNom} />
            <Field label="Dossier" value={e.dossierCode} />
            <Field label="Date pièce" value={formatDate(e.dateDocument)} />
            <Field label="Échéance" value={formatDate(e.dateEcheance)} />
            <Field label="Date règlement" value={formatDate(e.dateReglement)} />
            <Field label="Type" value={e.typeLibelle} />
            <Field label="Banque" value={e.banqueNom} />
            <Field label="Compte" value={e.compteCode} />
            <Field label="Dépôt" value={e.depotCode} />
            <Field label="Entité" value={e.entiteLibelle} />
          </FieldGrid>
        </Card>

        <Card title="Montants" accent="var(--sec-dossier)">
          <FieldGrid>
            <Field label="Montant brut" value={formatCurrency(e.montantBrut)} />
            <Field label="Reste à affecter" value={formatCurrency(e.montantBrutRestant)} />
            <Field label="Montant net" value={formatCurrency(e.montantNet)} />
          </FieldGrid>
        </Card>

        {e.notes && (
          <Card title="Notes">
            <p className="text-label text-foreground">{e.notes}</p>
          </Card>
        )}

        {/* Retenue/montant timbre, tier payeur/autrui, notaire, dossier de
            groupe, remise au siège, bordereau, date de pointage, C.R.A.S.,
            devise et détail d'affectation par échéance : pas encore exposés
            par GET /api/encaissements/{id} — demandé côté backend, voir
            instructions/from_front.md (#3). */}

        {e.dossierId && (
          <Button type="button" variant="outline" onClick={() => navigate(`/dossiers/${e.dossierId}`)}>
            Ouvrir le dossier {e.dossierCode ? e.dossierCode : ''} <ArrowUpRight data-icon="inline-end" />
          </Button>
        )}
      </div>
    </PageShell>
  );
}
