import ChoixUnique from '../../../components/ChoixUnique';
import { PastilleCouleur } from '../../../components/configuration/SelecteurCouleur';
import { Badge, Card, Field, FieldGrid } from '../../../components/ui';
import { formatDate, formatNumber } from '../../../lib/format';
import type { PropsOnglet } from '../../../lib/saisieLot';
import type { ElementReferentielProjetDto, LotDetailDto, ReferentielsProjetDto } from '../../../types/projet';
import { BarreAvancement } from '../commun';
import { libelleReferentiel } from '../hooks';
import { ChampNombre, ChampTexte } from './champsLot';

const LARGEUR = 'w-full';

const items = (liste: ElementReferentielProjetDto[] | undefined) => (liste ?? []).map((e) => ({ value: e.id, label: libelleReferentiel(e) }));

function Choix({ label, valeur, liste, tous, disabled, onChange }: Readonly<{
  label: string;
  valeur: string | null;
  liste: ElementReferentielProjetDto[] | undefined;
  tous?: string;
  disabled: boolean;
  onChange: (v: string | null) => void;
}>) {
  return (
    <Field
      label={label}
      value={
        <fieldset disabled={disabled} className="contents">
          <ChoixUnique items={items(liste)} value={valeur} tous={tous} placeholder="Choisir" largeur={LARGEUR} onChange={onChange} />
        </fieldset>
      }
    />
  );
}

const jours = (n: number | null) => (n === null ? null : `${formatNumber(n)} j`);

/** En-tête de la fiche : identité modifiable, statut, estimations (lecture seule) et avancement. */
export default function EnteteLot({ lot, champs, maj, lectureSeule, referentiels }: Readonly<PropsOnglet & { lot: LotDetailDto; referentiels: ReferentielsProjetDto | null }>) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      <Card title="Identification">
        <FieldGrid>
          <Field label="Code" value={lot.code} />
          <ChampTexte label="Description" valeur={champs.description} disabled={lectureSeule} onChange={(v) => maj('description', v)} />
          <Choix label="Fournisseur" valeur={champs.fournisseurId} liste={referentiels?.fournisseurs} tous="Aucun" disabled={lectureSeule} onChange={(v) => maj('fournisseurId', v)} />
          <Field label="Projet" value={lot.projetCode} />
          <Choix label="Type" valeur={champs.typeId} liste={referentiels?.typesLot} disabled={lectureSeule} onChange={(v) => maj('typeId', v)} />
          <Choix label="Catégorie" valeur={champs.categorieId} liste={referentiels?.categories} disabled={lectureSeule} onChange={(v) => maj('categorieId', v)} />
          <Field label="Devise" value={lot.deviseCode} />
          <Field
            label="Statut"
            value={
              <span className="flex items-center gap-1.5">
                {lot.statutCouleur && <PastilleCouleur nom={lot.statutCouleur} />}
                <Badge tone="info">{lot.statutDescription ?? lot.statutCode ?? '—'}</Badge>
                {lot.multiFournisseur && <Badge tone="amber">Multi-fournisseur</Badge>}
                {lot.clos && <Badge tone="neutral">Clos</Badge>}
              </span>
            }
          />
        </FieldGrid>
      </Card>
      <Card title="Prévisionnel">
        <FieldGrid>
          <Field label="Début prévisionnel" value={formatDate(lot.dateDebutPrevisionnelle)} />
          <Field label="Durée prévisionnelle" value={jours(lot.delaiPrevisionnelJours)} />
          <Field label="Fin prévisionnelle" value={formatDate(lot.dateFinPrevisionnelle)} />
        </FieldGrid>
      </Card>
      <Card title="Garantie et avancement">
        <FieldGrid>
          <ChampNombre label="Durée de garantie (mois)" valeur={champs.dureeGarantieMois} disabled={lectureSeule} onChange={(v) => maj('dureeGarantieMois', v)} />
          <Field label="Avancement décompté" value={<BarreAvancement pct={lot.avancementPct} />} />
        </FieldGrid>
      </Card>
    </div>
  );
}
