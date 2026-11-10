import { useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { RotateCcw } from 'lucide-react';
import DataGrid, { type ColonneGrille } from '../../components/DataGrid';
import Pagination from '../../components/Pagination';
import FiltresDocumentsAchat from '../../components/achat/FiltresDocumentsAchat';
import FicheDocumentAchatFenetre from '../../components/achat/FicheDocumentAchatFenetre';
import BarreEtatListe from '../../components/liste/BarreEtatListe';
import BarreOutilsFlottante from '../../components/liste/BarreOutilsFlottante';
import EnteteListe from '../../components/liste/EnteteListe';
import PageListe from '../../components/liste/PageListe';
import { Badge, EmptyState, ErrorState, LoadingState, ResultsRegion } from '../../components/ui';
import { Button } from '../../components/ui/button';
import BandeTotauxAchat from '../../components/achat/BandeTotauxAchat';
import { cheminExportDocumentsAchat, getDocumentsAchat, getReferentielsAchat, getTotauxDocumentsAchat } from '../../lib/apiAchat';
import { DEFAULT_PAGE_SIZE } from '../../lib/api';
import { FILTRES_ACHAT_VIDES, libelleNatureAchat, libelleStatutAchat, tonStatutAchat, type EtatFiltresAchat } from '../../lib/documentsAchat';
import { voisinsDe } from '../../lib/fenetreFiche';
import { formatCurrency, pluriel } from '../../lib/format';
import { cleFiltresFermes, useBooleenMemorise } from '../../lib/outilsListe';
import { useApi, useDebouncedValue } from '../../lib/useApi';
import { useExportListe } from '../../lib/useExportListe';
import type { DocumentAchatListItemDto, FiltresDocumentsAchat as FiltresServeur, NatureDocumentAchat } from '../../types/achat';

const COLONNES: ColonneGrille<DocumentAchatListItemDto>[] = [
  { nom: 'code', libelle: 'Code', largeur: 8, classe: 'font-medium text-foreground' },
  { nom: 'nature', libelle: 'Nature', largeur: 8, valeur: libelleNatureAchat, rendu: libelleNatureAchat },
  { nom: 'dateDocument', libelle: 'Date', type: 'DATE', largeur: 7 },
  { nom: 'dateEcheance', libelle: 'Échéance', type: 'DATE', largeur: 7 },
  { nom: 'fournisseurNom', libelle: 'Fournisseur', largeur: 12 },
  { nom: 'projetCode', libelle: 'Projet', largeur: 7 },
  { nom: 'lotCode', libelle: 'Lot', largeur: 6 },
  {
    nom: 'statutDescription',
    libelle: 'Statut',
    largeur: 10,
    valeur: libelleStatutAchat,
    rendu: (d) => <Badge tone={tonStatutAchat(d)}>{libelleStatutAchat(d)}</Badge>,
  },
  { nom: 'montantTTC', libelle: 'TTC', type: 'MONTANT', largeur: 8 },
  { nom: 'montantAPayer', libelle: 'À payer', type: 'MONTANT', largeur: 8 },
  { nom: 'montantRegle', libelle: 'Réglé', type: 'MONTANT', largeur: 8 },
  {
    nom: 'resteARegler',
    libelle: 'Reste',
    type: 'MONTANT',
    largeur: 8,
    rendu: (d) => (
      <span className="inline-flex items-center gap-1">
        {d.aDeduire && <Badge tone="amber">Avance à déduire</Badge>}
        {d.tropRegle && <Badge tone="amber">Trop réglé</Badge>}
        <span className={d.resteARegler > 0 ? 'font-semibold text-destructive' : undefined}>{formatCurrency(d.resteARegler)}</span>
      </span>
    ),
  },
];

const BASE = '/achat/documents';

/** Pose ou retire un paramètre d'URL ; sans effet si `touche` est faux. */
function poser(params: URLSearchParams, cle: string, valeur: string | null, touche: boolean) {
  if (!touche) return;
  if (valeur) params.set(cle, valeur);
  else params.delete(cle);
}

export default function DocumentsAchatList() {
  const navigate = useNavigate();
  const { search: requeteUrl } = useLocation();
  const { id: idOuvert } = useParams();
  const [params, setParams] = useSearchParams();
  const [local, setLocal] = useState<EtatFiltresAchat>(FILTRES_ACHAT_VIDES);
  const [page, setPage] = useState(0);
  const [filtresFermes, basculerFiltres] = useBooleenMemorise(cleFiltresFermes('achat-documents'));

  // `natures`, `nonSoldes`, `okPourPaiement` et `fournisseurId` vivent dans l'URL : le menu et le solde fournisseurs les posent.
  const etat: EtatFiltresAchat = {
    ...local,
    natures: params.getAll('natures'),
    nonSoldes: params.get('nonSoldes') === 'true',
    okPourPaiement: params.get('okPourPaiement') === 'true',
    fournisseurId: params.get('fournisseurId'),
  };
  const recherche = useDebouncedValue(etat.search.trim());

  function changer(patch: Partial<EtatFiltresAchat>) {
    setPage(0);
    const { natures, nonSoldes, okPourPaiement, fournisseurId, ...autres } = patch;
    setLocal((courant) => ({ ...courant, ...autres }));
    const suivant = new URLSearchParams(params);
    if (natures !== undefined) {
      suivant.delete('natures');
      natures.forEach((n) => suivant.append('natures', n));
    }
    poser(suivant, 'nonSoldes', nonSoldes ? 'true' : null, nonSoldes !== undefined);
    poser(suivant, 'okPourPaiement', okPourPaiement ? 'true' : null, okPourPaiement !== undefined);
    poser(suivant, 'fournisseurId', fournisseurId ?? null, fournisseurId !== undefined);
    if (suivant.toString() !== params.toString()) setParams(suivant, { replace: true });
  }

  function reinitialiser() {
    setPage(0);
    setLocal(FILTRES_ACHAT_VIDES);
    setParams(new URLSearchParams(), { replace: true });
  }

  const filtres: FiltresServeur = {
    natures: etat.natures.length > 0 ? (etat.natures as NatureDocumentAchat[]) : undefined,
    statutIds: etat.statutIds.length > 0 ? etat.statutIds : undefined,
    projetIds: etat.projetIds.length > 0 ? etat.projetIds : undefined,
    fournisseurId: etat.fournisseurId ?? undefined,
    du: etat.du || undefined,
    au: etat.au || undefined,
    nonSoldes: etat.nonSoldes || undefined,
    okPourPaiement: etat.okPourPaiement || undefined,
    search: recherche || undefined,
  };

  const referentiels = useApi(() => getReferentielsAchat(), [], 'achat-referentiels');
  const liste = useApi(() => getDocumentsAchat(filtres, { page, size: DEFAULT_PAGE_SIZE }), [JSON.stringify(filtres), page], 'achat-documents');
  const totaux = useApi(() => (etat.nonSoldes ? getTotauxDocumentsAchat(filtres) : Promise.resolve(null)), [JSON.stringify(filtres), etat.nonSoldes], 'achat-documents-totaux');
  const exportListe =useExportListe(cheminExportDocumentsAchat(), { ...filtres }, 'pieces-achat');

  const lignes = liste.data?.content ?? [];
  const decompte = liste.data ? pluriel(liste.data.totalElements, 'pièce') : undefined;
  const ouvrir = (id: string) => void navigate(`${BASE}/${id}${requeteUrl}`);
  const voisins = voisinsDe(lignes.map((l) => l.id), idOuvert, ouvrir);

  return (
    <PageListe titre="Pièces d'achat">
      <EnteteListe titre="Pièces d'achat" lignes={decompte} />
      <FiltresDocumentsAchat
        etat={etat}
        referentiels={referentiels.data ?? undefined}
        ferme={filtresFermes}
        onBasculer={basculerFiltres}
        onChange={changer}
        onReinitialiser={reinitialiser}
      />

      <div className="flex min-h-0 flex-1 flex-col gap-2 px-3 pt-2">
        {liste.loading && !liste.data && !liste.error && <LoadingState />}
        {liste.error && (
          <div className="flex flex-col items-center gap-2">
            <ErrorState message={liste.error} />
            <Button type="button" variant="outline" size="sm" onClick={() => void liste.refetch()}>
              <RotateCcw data-icon="inline-start" /> Réessayer
            </Button>
          </div>
        )}
        {!liste.error && !totaux.error && totaux.data && <BandeTotauxAchat totaux={totaux.data} />}
        {!liste.error && liste.data && (
          <ResultsRegion loading={liste.loading}>
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto rounded-xl border border-border bg-card">
              {lignes.length === 0 ? (
                <EmptyState title="Aucune pièce dans votre périmètre" />
              ) : (
                <DataGrid
                  cleOrdre="achat-documents"
                  rows={lignes}
                  colonnes={COLONNES}
                  onOuvrir={ouvrir}
                  libelleLigne={(d) => `Ouvrir la pièce ${d.code ?? d.id}`}
                  bandeauRegroupement={false}
                />
              )}
            </div>
            <div className="shrink-0">
              <Pagination page={liste.data.page} totalPages={liste.data.totalPages} totalElements={liste.data.totalElements} onPageChange={setPage} />
            </div>
          </ResultsRegion>
        )}
      </div>
      <BarreEtatListe lignes={decompte ?? '—'} selection="aucune" alerte={exportListe.erreur} />
      <BarreOutilsFlottante
        cle="achat-documents"
        ligneSelectionnee={false}
        actions={[
          { id: 'rafraichir', onClick: () => void liste.refetch() },
          { id: 'exporter', onClick: () => void exportListe.exporter('xlsx'), disabled: exportListe.enCours },
        ]}
      />
      {idOuvert && <FicheDocumentAchatFenetre key={idOuvert} id={idOuvert} voisins={voisins} onFermer={() => void navigate(`${BASE}${requeteUrl}`)} />}
    </PageListe>
  );
}
