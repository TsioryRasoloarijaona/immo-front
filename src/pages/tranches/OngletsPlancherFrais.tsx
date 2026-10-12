import GrilleOnglet, { type ColonneOnglet } from '../../components/patrimoine/GrilleOnglet';
import { NombreCellule } from '../../components/patrimoine/CellulesOnglet';
import { colonneReference } from '../../lib/colonnesOnglet';
import {
  getCategoriesClassement,
  getCategoriesFrais,
  listFraisTranche,
  listPlancherCouvert,
  saveFraisTranche,
  savePlancherCouvert,
} from '../../lib/api';
import { formatCurrency, formatNumber, formatPercent, formatSurface } from '../../lib/format';
import { montantsFrais } from '../../lib/fraisVente';
import { useApi } from '../../lib/useApi';
import type { FraisTrancheDto, PlancherCouvertDto, ReferentielItemDto } from '../../types';

type Plancher = Partial<PlancherCouvertDto>;
type Frais = Partial<FraisTrancheDto> & { saisiEnTTC?: boolean };

/** Catégories de nature Bâtiment, des articles puis des sous-articles. */
async function categoriesBaties(): Promise<ReferentielItemDto[]> {
  const [articles, sousArticles] = await Promise.all([getCategoriesClassement(false), getCategoriesClassement(true)]);
  return [...articles, ...sousArticles];
}

const versPlancher = (d: PlancherCouvertDto): Plancher => ({ ...d });
const nouveauPlancher = (): Plancher => ({});

export function OngletPlancherCouvert({
  trancheId,
  admin,
  apresEnregistrement,
}: Readonly<{ trancheId: string; admin: boolean; apresEnregistrement: () => void }>) {
  const { data: categories } = useApi(categoriesBaties, []);
  const colonnes: ColonneOnglet<Plancher>[] = [
    colonneReference<Plancher>({
      cle: 'categorieId',
      libelle: 'Catégorie',
      items: categories,
      code: (l) => l.categorieCode,
      description: (l) => l.categorieDescription,
      choisir: (categorieId, c) => ({ categorieId, categorieCode: c?.code, categorieDescription: c?.description }),
    }),
    {
      cle: 'surface',
      libelle: 'Superficie (m²)',
      droite: true,
      lecture: (l) => formatSurface(l.surface),
      saisie: (l, changer, invalide, etiquette) => (
        <NombreCellule etiquette={etiquette} genre="nombre" valeur={l.surface} invalide={invalide} onChange={(surface) => changer({ surface })} />
      ),
    },
  ];
  return (
    <GrilleOnglet
      titre="Plancher couvert"
      dep={trancheId}
      charger={() => listPlancherCouvert(trancheId)}
      versSaisie={versPlancher}
      nouvelle={nouveauPlancher}
      enregistrer={(lignes) => savePlancherCouvert(trancheId, lignes.map((l) => ({ id: l.id, categorieId: l.categorieId, surface: l.surface })))}
      colonnes={colonnes}
      admin={admin}
      vide="Aucune superficie couverte saisie."
      apresEnregistrement={apresEnregistrement}
      pied={(lignes) => (
        <tr className="border-t border-border font-semibold">
          <td className="px-3 py-1.5">Plancher couvert</td>
          <td className="px-3 py-1.5 text-right">{formatSurface(lignes.reduce((s, l) => s + (l.surface ?? 0), 0))}</td>
          {admin && <td />}
        </tr>
      )}
    />
  );
}

const versFrais = (d: FraisTrancheDto): Frais => ({ ...d });
const nouveauFrais = (): Frais => ({ tauxTva: 0 });

/** HT ↔ TTC en direct, même formule que le serveur ; le montant saisi en dernier fait foi. */
function recalculer(l: Frais, patch: Partial<Frais>): Partial<Frais> {
  const suivant = { ...l, ...patch };
  const ttc = suivant.saisiEnTTC === true;
  const m = montantsFrais(ttc ? suivant.montantTTC : suivant.montantHT, suivant.tauxTva, ttc);
  return { ...patch, montantHT: m.ht, montantTTC: m.ttc };
}

function colonnesFrais(categories: ReferentielItemDto[] | null): ColonneOnglet<Frais>[] {
  return [
    colonneReference<Frais>({
      cle: 'categorieReglementId',
      libelle: 'Frais',
      items: categories,
      code: (l) => l.categorieCode,
      description: (l) => l.categorieDescription,
      choisir: (categorieReglementId, c) => ({ categorieReglementId, categorieCode: c?.code, categorieDescription: c?.description }),
    }),
    {
      cle: 'ordre',
      libelle: 'O.D.T.',
      droite: true,
      lecture: (l) => formatNumber(l.ordre),
      saisie: (l, changer, invalide, etiquette) => (
        <NombreCellule etiquette={etiquette} genre="entier" valeur={l.ordre} invalide={invalide} onChange={(ordre) => changer({ ordre })} />
      ),
    },
    {
      cle: 'montantHT',
      libelle: 'Montant HT',
      droite: true,
      lecture: (l) => formatCurrency(l.montantHT),
      saisie: (l, changer, invalide, etiquette) => (
        <NombreCellule etiquette={etiquette} genre="montant" valeur={l.montantHT} invalide={invalide}
          onChange={(montantHT) => changer(recalculer(l, { montantHT, saisiEnTTC: false }))} />
      ),
    },
    {
      cle: 'tauxTva',
      libelle: 'TVA',
      droite: true,
      lecture: (l) => formatPercent(l.tauxTva, 2),
      saisie: (l, changer, invalide, etiquette) => (
        <NombreCellule etiquette={etiquette} genre="taux" valeur={l.tauxTva} invalide={invalide}
          onChange={(tauxTva) => changer(recalculer(l, { tauxTva }))} />
      ),
    },
    {
      cle: 'montantTTC',
      libelle: 'Montant TTC',
      droite: true,
      lecture: (l) => formatCurrency(l.montantTTC),
      saisie: (l, changer, invalide, etiquette) => (
        <NombreCellule etiquette={etiquette} genre="montant" valeur={l.montantTTC} invalide={invalide}
          onChange={(montantTTC) => changer(recalculer(l, { montantTTC, saisiEnTTC: true }))} />
      ),
    },
    {
      cle: 'pourcentageDe',
      libelle: '% du prix de vente',
      droite: true,
      lecture: (l) => formatNumber(l.pourcentageDe, 2),
      saisie: (l, changer, invalide, etiquette) => (
        <NombreCellule etiquette={etiquette} genre="nombre" valeur={l.pourcentageDe} invalide={invalide}
          onChange={(pourcentageDe) => changer({ pourcentageDe })} />
      ),
    },
  ];
}

export function OngletFrais({ trancheId, admin }: Readonly<{ trancheId: string; admin: boolean }>) {
  const { data: categories } = useApi(getCategoriesFrais, []);
  return (
    <GrilleOnglet
      titre="Frais"
      dep={trancheId}
      charger={() => listFraisTranche(trancheId)}
      versSaisie={versFrais}
      nouvelle={nouveauFrais}
      enregistrer={(lignes) =>
        saveFraisTranche(
          trancheId,
          lignes.map((l) => ({
            id: l.id,
            categorieReglementId: l.categorieReglementId,
            ordre: l.ordre,
            montantHT: l.montantHT,
            montantTTC: l.montantTTC,
            tauxTva: l.tauxTva,
            pourcentageDe: l.pourcentageDe,
            saisiEnTTC: l.saisiEnTTC === true,
          })),
        )
      }
      colonnes={colonnesFrais(categories)}
      admin={admin}
      vide="Aucun frais de vente paramétré."
    />
  );
}
