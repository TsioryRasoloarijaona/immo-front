import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DataGrid from '../../../components/DataGrid';
import FiltresEtatsAchat from '../../../components/achat/FiltresEtatsAchat';
import OutilsEtatAchat from '../../../components/achat/OutilsEtatAchat';
import ResultatEtatAchat from '../../../components/achat/ResultatEtatAchat';
import EnteteListe from '../../../components/liste/EnteteListe';
import PageListe from '../../../components/liste/PageListe';
import { classeAnnulee, colonnesSuivi, useFiltresEtatsAchat, type ConfigSuiviAchat } from '../../../lib/etatsAchat';
import { formatCurrency, pluriel } from '../../../lib/format';
import { enIssue } from '../../../lib/rapports';
import { useApi } from '../../../lib/useApi';
import type { LigneSuiviAvance, LigneSuiviRetenue } from '../../../types/etatsAchat';

/** Suivi des avances ou des retenues de garantie : une ligne par pièce, totaux du serveur (hors annulées). */
export default function SuiviPiecesAchat<L extends LigneSuiviAvance | LigneSuiviRetenue, T>({ config }: Readonly<{ config: ConfigSuiviAchat<L, T> }>) {
  const cle = `achat-etat-${config.etat}`;
  const navigate = useNavigate();
  const etatFiltres = useFiltresEtatsAchat(cle);
  const { filtres } = etatFiltres;
  const api = useApi(() => enIssue(config.charger(filtres), [403]), [config.etat, JSON.stringify(filtres)], cle);

  const suivi = api.data && 'donnees' in api.data ? api.data.donnees : null;
  const lignes = useMemo(() => (suivi?.lignes ?? []).map((l, i) => ({ ...l, id: String(i) })), [suivi]);
  const colonnes = useMemo(() => colonnesSuivi(config), [config]);
  const decompte = suivi ? pluriel(lignes.length, 'pièce') : undefined;

  return (
    <PageListe titre={config.titre}>
      <EnteteListe titre={config.titre} lignes={decompte} />
      <FiltresEtatsAchat etat={etatFiltres} textes />
      <ResultatEtatAchat api={api} vide={(d) => d.lignes.length === 0}>
        {(d) => (
          <>
            <div role="status" className="flex shrink-0 flex-wrap items-baseline gap-x-5 gap-y-1 rounded-xl border border-border bg-card px-3 py-1.5 text-label font-semibold whitespace-nowrap tabular-nums">
              {config.montants.map((m) => (
                <span key={m.nom}>
                  {m.libelle} {formatCurrency(m.total(d.totaux))}
                </span>
              ))}
              <span className="font-normal text-muted-foreground">Hors pièces annulées</span>
            </div>
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto rounded-xl border border-border bg-card">
              <DataGrid
                cleOrdre={cle}
                rows={lignes}
                colonnes={colonnes}
                classeLigne={classeAnnulee}
                onOuvrir={(id) => {
                  const ligne = lignes.at(Number(id));
                  if (ligne) void navigate(`/achat/documents/${ligne.pieceId}`);
                }}
                libelleLigne={(l) => `Ouvrir la pièce ${l.code ?? ''}`}
                bandeauRegroupement={false}
              />
            </div>
          </>
        )}
      </ResultatEtatAchat>
      <OutilsEtatAchat etat={config.etat} filtres={filtres} decompte={decompte} onRafraichir={api.refetch} />
    </PageListe>
  );
}
