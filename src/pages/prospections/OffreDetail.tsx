import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FileText, Pencil, Trash2 } from 'lucide-react';
import PageShell from '../../components/PageShell';
import CadreFiche, { EnteteFiche } from '../../components/CadreFiche';
import FicheShell from '../../components/FicheShell';
import { ChampLecture, GrilleFiche } from '../../components/ChampsFiche';
import DevisFormSection from '../../components/DevisFormSection';
import FicheOffreActions from '../../components/offres/FicheOffreActions';
import BoutonDossierOffre from '../../components/offres/BoutonDossierOffre';
import Modal from '../../components/Modal';
import { Badge, Card, EmptyState, ErrorState, Field, FieldGrid, LoadingState } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { ApiError, getOffre, modifierOffre, supprimerOffre } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { useConfirm } from '../../lib/confirmContext';
import { detailOffre, modificationOffre, valeursEditionOffre } from '../../lib/offres';
import { formatCurrency, formatDate, formatDateTime, formatSurface } from '../../lib/format';
import type { CreerDevisRequest, FicheDevisDto } from '../../types';

type OngletOffre = 'sous-articles' | 'schema';

const FIL = [{ label: 'Ventes' }, { label: 'Offres', to: '/offres' }];

export default function OffreDetail() {
  const { id = '' } = useParams();
  return <FicheOffre key={id} id={id} />;
}

/** 404 → `null` : « Offre introuvable » plutôt qu'une erreur (inconnue ou hors périmètre, indiscernables). */
async function lireOffre(id: string): Promise<FicheDevisDto | null> {
  try {
    return await getOffre(id);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

function FicheOffre({ id }: Readonly<{ id: string }>) {
  const { data: fiche, loading, error, refetch } = useApi(() => lireOffre(id), [id]);
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [onglet, setOnglet] = useState<OngletOffre>('sous-articles');
  const [edition, setEdition] = useState(false);
  const [erreurSuppression, setErreurSuppression] = useState<string | null>(null);

  if (loading && !fiche) return <PageShell title="Offre" crumbs={FIL}><LoadingState /></PageShell>;
  if (error) return <PageShell title="Offre" crumbs={FIL}><ErrorState message={error} /></PageShell>;
  if (!fiche) {
    return (
      <PageShell title="Offre introuvable" crumbs={FIL}>
        <EmptyState title="Offre introuvable" message="Cette offre n'existe pas ou n'est pas dans votre périmètre." />
      </PageShell>
    );
  }

  const o = fiche.offre;
  const ficheChargee = fiche;

  async function supprimer() {
    const ok = await confirm({
      title: 'Supprimer l’offre',
      message: `Supprimer l'offre ${o.code ?? ''} ? Ses sous-articles et son schéma de financement seront supprimés aussi.`,
      confirmLabel: 'Supprimer',
      cancelLabel: 'Revenir',
    });
    if (!ok) return;
    setErreurSuppression(null);
    try {
      await supprimerOffre(o.id);
      void navigate('/offres');
    } catch (err) {
      setErreurSuppression(err instanceof Error ? err.message : 'Échec de la suppression.');
    }
  }

  async function enregistrer(saisie: CreerDevisRequest) {
    await modifierOffre(o.id, modificationOffre(ficheChargee, saisie));
    setEdition(false);
    void refetch();
  }

  return (
    <CadreFiche
      title={`Offre ${o.code ?? ''}`.trim()}
      crumbs={FIL}
      fullHeight
      icon={<FileText />}
      accent="var(--sec-offre)"
      accentBg="var(--sec-offre-bg)"
      entete={
        <EnteteFiche code={o.code} nom={o.prospect || 'Offre'}>
          {o.tranche && <Badge tone="neutral">{o.trancheDescription || o.tranche}</Badge>}
          <span className="text-label font-semibold tabular-nums text-foreground">
            {formatCurrency(o.montants?.prixVenteTTC)}
          </span>
        </EnteteFiche>
      }
      actions={
        <span className="flex flex-wrap items-center gap-2">
          <BoutonDossierOffre fiche={fiche} />
          <FicheOffreActions offre={o} compact={false} />
          <Button variant="outline" size="sm" onClick={() => setEdition(true)}>
            <Pencil data-icon="inline-start" /> Modifier
          </Button>
          {/* Laissé actif sur une offre liée : le 409 du serveur, qui nomme le dossier, fait foi. */}
          <Button variant="outline" size="sm" onClick={supprimer}>
            <Trash2 data-icon="inline-start" /> Supprimer
          </Button>
        </span>
      }
    >
      <FicheShell
        ongletActif={onglet}
        onOngletChange={(v) => setOnglet(v as OngletOffre)}
        barreAction={<BarreOffre fiche={fiche} erreur={erreurSuppression} />}
        formulaire={<EnteteOffre fiche={fiche} />}
        panneau={<Card padded={false} className="h-full overflow-auto"><div className="p-3">{detailOffre(o)}</div></Card>}
        onglets={[
          { id: 'sous-articles', libelle: 'Sous-articles', compteur: fiche.sousArticles.length, contenu: <SousArticles fiche={fiche} /> },
          { id: 'schema', libelle: 'Schéma de financement', compteur: o.schemaFinancement?.length ?? 0, contenu: <Schema fiche={fiche} /> },
        ]}
      />

      {edition && (
        <Modal title={`Modifier l'offre ${o.code ?? ''}`.trim()} onClose={() => setEdition(false)} width={760}>
          <DevisFormSection
            bare
            defaultTrancheId={o.trancheId}
            defaultArticleId={o.articleId}
            edition={valeursEditionOffre(fiche)}
            onAdd={enregistrer}
          />
        </Modal>
      )}
    </CadreFiche>
  );
}

/** D1 : une offre liée à un dossier reste modifiable mais ne se supprime plus (409 serveur). */
function BarreOffre({ fiche, erreur }: Readonly<{ fiche: FicheDevisDto; erreur: string | null }>) {
  const dossier = fiche.dossierLie;
  if (!dossier && !erreur) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border border-(--info-border) bg-(--info-bg) px-3 py-2">
      {dossier && (
        <>
          {dossier.id ? (
            <Link to={`/dossiers/${dossier.id}`} className="text-label font-medium text-(--info) hover:underline">
              Dossier {dossier.code}
            </Link>
          ) : (
            <span className="text-label font-medium text-foreground">Dossier de location {dossier.code}</span>
          )}
          <span className="text-micro text-muted-foreground">
            Offre transformée en dossier : modification possible, suppression impossible.
          </span>
        </>
      )}
      {erreur && <span className="text-micro text-destructive">{erreur}</span>}
    </div>
  );
}

function EnteteOffre({ fiche }: Readonly<{ fiche: FicheDevisDto }>) {
  const o = fiche.offre;
  return (
    <Card padded={false} className="h-full">
      <div className="p-3">
        <GrilleFiche>
          <ChampLecture label="Date" valeur={formatDate(o.dateDocument)} />
          <ChampLecture label="Tranche" valeur={o.trancheDescription || o.tranche} />
          <ChampLecture label="Article" valeur={[o.article, o.articleDescription].filter(Boolean).join(' — ')} />
          <ChampLecture label="Catégorie" valeur={o.articleCategorie} />
          <ChampLecture label="Type" valeur={o.articleType} />
          <ChampLecture label="Superficie" valeur={o.articleSuperficie == null ? undefined : formatSurface(o.articleSuperficie)} />
          <ChampLecture
            label="Prospection"
            valeur={o.prospectionId ? <Link to={`/prospections/${o.prospectionId}`} className="text-(--info) hover:underline">{o.prospectionCode}</Link> : o.prospectionCode}
          />
          <ChampLecture label="Prospect" valeur={o.prospect} />
          <ChampLecture label="Commercial" valeur={o.commercial} />
          <ChampLecture label="Mode de paiement" valeur={o.modePaiement} />
          {o.notes && <ChampLecture label="Notes" valeur={o.notes} multiligne />}
        </GrilleFiche>
        <div className="mt-3 border-t border-border pt-2">
          <FieldGrid>
            <Field label="Créée par" value={o.creePar} />
            <Field label="Créée le" value={formatDateTime(o.creeLe)} />
            <Field label="Modifiée par" value={o.modifiePar} />
            <Field label="Modifiée le" value={formatDateTime(o.modifieLe)} />
          </FieldGrid>
        </div>
      </div>
    </Card>
  );
}

function SousArticles({ fiche }: Readonly<{ fiche: FicheDevisDto }>) {
  if (fiche.sousArticles.length === 0) {
    return <EmptyState title="Aucun sous-article" message="Cette offre ne porte que son article principal." />;
  }
  return (
    <Table containerClassName="overflow-visible">
      <TableHeader className="sticky top-0 z-1">
        <TableRow className="hover:bg-card">
          <TableHead>Code</TableHead>
          <TableHead>Désignation</TableHead>
          <TableHead>Catégorie</TableHead>
          <TableHead className="text-right">Superficie</TableHead>
          <TableHead className="text-right">Avant remise TTC</TableHead>
          <TableHead className="text-right">Remise TTC</TableHead>
          <TableHead className="text-right">Après remise TTC</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {fiche.sousArticles.map((s) => (
          <TableRow key={s.id}>
            <TableCell className="font-mono">{s.code}</TableCell>
            <TableCell className="text-muted-foreground">{s.description}</TableCell>
            <TableCell>{s.categorie ? <Badge tone="neutral">{s.categorie}</Badge> : null}</TableCell>
            <TableCell className="text-right tabular-nums">{s.superficie == null ? '—' : formatSurface(s.superficie)}</TableCell>
            <TableCell className="text-right tabular-nums">{formatCurrency(s.prixAvantRemiseTTC)}</TableCell>
            <TableCell className="text-right tabular-nums text-muted-foreground">{formatCurrency(s.remiseTTC)}</TableCell>
            <TableCell className="text-right font-semibold tabular-nums">{formatCurrency(s.prixApresRemiseTTC)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function Schema({ fiche }: Readonly<{ fiche: FicheDevisDto }>) {
  const lignes = fiche.offre.schemaFinancement ?? [];
  if (lignes.length === 0) {
    return <EmptyState title="Pas de schéma" message="L'offre n'a pas de prix : aucun schéma de financement à calculer." />;
  }
  return (
    <>
      <p className="border-b border-border px-3 py-2 text-micro text-muted-foreground">
        {fiche.schemaFinancementSaisi
          ? 'Schéma saisi dans OMRAN : un changement de prix doit le respecter, sinon la modification est refusée.'
          : 'Schéma calculé depuis les pourcentages de la tranche, sur le prix TTC après remise.'}
      </p>
      <Table containerClassName="overflow-visible">
        <TableHeader className="sticky top-0 z-1">
          <TableRow className="hover:bg-card">
            <TableHead>Catégorie</TableHead>
            <TableHead className="text-right">Montant</TableHead>
            <TableHead>Prix</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lignes.map((l, i) => (
            <TableRow key={`${l.categorie ?? ''}-${i}`}>
              <TableCell>{l.categorie}</TableCell>
              <TableCell className="text-right font-semibold tabular-nums">{formatCurrency(l.montant)}</TableCell>
              <TableCell className="text-muted-foreground">{l.exclureDuPrix ? 'Hors prix' : 'Dans le prix'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
