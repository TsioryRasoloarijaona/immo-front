import { useMemo } from 'react';
import { Clock, FileText, Percent } from 'lucide-react';
import DataGrid from '../../../components/DataGrid';
import FiltresEtatsAchat from '../../../components/achat/FiltresEtatsAchat';
import OutilsEtatAchat from '../../../components/achat/OutilsEtatAchat';
import ResultatEtatAchat from '../../../components/achat/ResultatEtatAchat';
import EnteteListe from '../../../components/liste/EnteteListe';
import PageListe from '../../../components/liste/PageListe';
import { Card, StatCard } from '../../../components/ui';
import { getTvaDeductible } from '../../../lib/apiEtatsAchat';
import { COLONNES_LIGNES_TVA, COLONNES_MOIS_TVA, classeAnnulee, useFiltresEtatsAchat } from '../../../lib/etatsAchat';
import { formatCurrency, formatNumber, pluriel } from '../../../lib/format';
import { enIssue } from '../../../lib/rapports';
import { useApi } from '../../../lib/useApi';

const CLE = 'achat-etat-tva';
const TITRE = 'État de la TVA déductible';

export default function TvaDeductible() {
  const etatFiltres = useFiltresEtatsAchat(CLE);
  const { filtres } = etatFiltres;
  const api = useApi(() => enIssue(getTvaDeductible(filtres), [403]), [JSON.stringify(filtres)], CLE);

  const etat = api.data && 'donnees' in api.data ? api.data.donnees : null;
  const lignes = useMemo(() => (etat?.lignes ?? []).map((l, i) => ({ ...l, id: `${l.factureId}|${i}` })), [etat]);
  const mois = useMemo(() => (etat?.parMois ?? []).map((m) => ({ ...m, id: m.mois })), [etat]);
  const decompte = etat ? pluriel(lignes.length, 'ligne') : undefined;

  return (
    <PageListe titre={TITRE}>
      <EnteteListe titre={TITRE} lignes={decompte} />
      <FiltresEtatsAchat etat={etatFiltres} />
      <ResultatEtatAchat api={api} vide={(d) => d.lignes.length === 0}>
        {(d) => (
          <>
            <div className="grid shrink-0 gap-2 sm:grid-cols-3">
              <StatCard label="TVA déductible" value={formatCurrency(d.totaux.montantTva)} tone="success" icon={<Percent />} sub="Hors avoirs et factures annulées" />
              <StatCard label="Factures" value={formatNumber(d.totaux.factures)} icon={<FileText />} />
              <StatCard label="TVA en attente de validation" value={formatCurrency(d.totaux.montantTvaEnAttente)} tone="amber" icon={<Clock />} />
            </div>
            <Card title="TVA déductible par mois" padded={false}>
              <DataGrid cleOrdre={`${CLE}-mois`} rows={mois} colonnes={COLONNES_MOIS_TVA} bandeauRegroupement={false} />
            </Card>
            <Card title="Lignes" padded={false}>
              <DataGrid cleOrdre={`${CLE}-lignes`} rows={lignes} colonnes={COLONNES_LIGNES_TVA} classeLigne={classeAnnulee} bandeauRegroupement={false} />
            </Card>
          </>
        )}
      </ResultatEtatAchat>
      <OutilsEtatAchat etat="tva-deductible" filtres={filtres} decompte={decompte} onRafraichir={api.refetch} />
    </PageListe>
  );
}
