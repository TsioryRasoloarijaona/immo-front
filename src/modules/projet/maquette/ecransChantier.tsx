import { Badge } from '../../../components/ui';
import { arrondi, construire, date, montant, nombre, texte } from '../../../components/maquette/colonnes';
import { configListe } from '../../../components/maquette/configListe';
import { PROJETS } from '../../../components/maquette/communes';
import type { ConfigEcran, Ligne } from '../../../components/maquette/types';
import type { BadgeTone } from '../../../types';
import { LOTS } from './ecransLots';

/** Couleur de chaque statut de réserve (BulObservationStatus). */
const TON_RESERVE: Record<string, BadgeTone> = {
  OUVERTE: 'warning',
  'EN COURS DE TRAITEMENT': 'progress',
  'LEVÉE': 'success',
  'REPORTÉE': 'amber',
  'ANNULÉE': 'neutral',
};

const REUNIONS = construire(
  ['numero', 'date', 'projet', 'type', 'lieu', 'participants'],
  [
    ['RC-2026-001', '2026-03-04', 'ANF-RES', 'Réunion de chantier', 'Bureau de chantier Anfa', 7],
    ['RC-2026-002', '2026-05-13', 'ANF-RES', 'Réunion de chantier', 'Bureau de chantier Anfa', 8],
    ['RC-2026-003', '2026-06-24', 'PAL-VIL', 'Réunion de coordination', 'Siège Horizon Immobilier', 11],
    ['RC-2026-004', '2026-09-09', 'TAM-APP', 'Réunion de chantier', 'Bureau de chantier Tamesna', 6],
  ],
);

const RESERVES = construire(
  ['reunion', 'observation', 'lot', 'responsable', 'echeance', 'statut'],
  [
    ['1', 'Reprise des attentes du voile périphérique', 'LOT-01', 'Salma Idrissi', '2026-03-25', 'LEVÉE'],
    ['1', "Évacuation des eaux de fouille à compléter", 'LOT-01', 'Karim Benali', '2026-03-18', 'EN COURS DE TRAITEMENT'],
    ['2', "Fournir les fiches d'agrément de l'étanchéité", 'LOT-02', 'Youssef Amrani', '2026-06-03', 'OUVERTE'],
    ['2', 'Nivellement des dalles du R+1', 'LOT-01', 'Salma Idrissi', '2026-06-10', 'REPORTÉE'],
    ['3', 'Réservations électriques à valider avec le BET', 'LOT-04', 'Youssef Amrani', '2026-07-15', 'OUVERTE'],
    ['4', 'Clôture provisoire de la zone de stockage', 'LOT-09', 'Karim Benali', '2026-09-30', 'ANNULÉE'],
  ],
);

const COLONNES_RESERVE = [
  texte('observation', 'Observation / réserve', 26),
  texte('lot', 'Lot', 8),
  texte('responsable', 'Responsable', 14),
  date('echeance', 'Échéance'),
  { ...texte('statut', 'Statut', 14), rendu: (r: Ligne) => <Badge tone={TON_RESERVE[String(r.statut)] ?? 'neutral'}>{String(r.statut)}</Badge> },
];

export const configReunions: ConfigEcran = configListe({
  titre: 'Réunions de chantier',
  unite: 'réunion',
  nature: 'Réunion de chantier',
  colonnes: [texte('numero', 'N°', 10), date('date', 'Date'), texte('projet', 'Projet', 9), texte('type', 'Type de réunion', 16), texte('lieu', 'Lieu', 18), nombre('participants', 'Participants', 8)],
  lignes: REUNIONS,
  filtres: ['projet', 'type'],
  colonneDate: 'date',
  onglets: (l) => [
    { id: 'observations', libelle: 'Observations et réserves', colonnes: COLONNES_RESERVE, lignes: RESERVES.filter((r) => r.reunion === l.id) },
  ],
});

export const configModifications: ConfigEcran = configListe({
  titre: 'Modifications',
  unite: 'modification',
  nature: 'Modification',
  colonnes: [
    texte('numero', 'N°', 9), date('date', 'Date'), texte('projet', 'Projet', 9), texte('objet', 'Objet', 26), texte('demandeur', 'Demandeur', 14), montant('montant', 'Incidence HT'), texte('statut', 'Statut', 10),
  ],
  lignes: construire(
    ['numero', 'date', 'projet', 'objet', 'demandeur', 'montant', 'statut'],
    [
      ['MOD-001', '2026-04-02', 'ANF-RES', 'Ajout de 2 places de parking en sous-sol', 'Karim Benali', 185000, 'VALIDÉE'],
      ['MOD-002', '2026-05-21', 'PAL-VIL', 'Remplacement du carrelage des terrasses', 'Salma Idrissi', -42000, 'VALIDÉE'],
      ['MOD-003', '2026-08-11', 'TAM-APP', 'Gaine technique supplémentaire en cage d’escalier', 'Youssef Amrani', 67500, 'EN ATTENTE'],
    ],
  ),
  filtres: ['projet', 'statut'],
  colonneDate: 'date',
});

const marcheDuProjet = (code: string): number => arrondi(LOTS.filter((l) => l.projet === code).reduce((s, l) => s + Number(l.marche), 0));

export const configPrevisions: ConfigEcran = configListe({
  titre: 'Prévisions',
  unite: 'version de prévision',
  nature: 'Prévision',
  colonnes: [texte('version', 'Version', 10), date('date', 'Date'), texte('projet', 'Projet', 9), texte('motif', 'Motif', 22), montant('total', 'Total prévu HT'), montant('realise', 'Réalisé à date')],
  lignes: PROJETS.flatMap((p, i) => [1, 2].map((v) => {
    const total = arrondi(marcheDuProjet(p.code) * (1 + 0.03 * (v - 1)));
    return { id: `${p.code}-${v}`, version: `V${v}`, date: `2026-0${3 + 3 * (v - 1) + i}-15`, projet: p.code, motif: v === 1 ? 'Budget initial' : 'Recalage après adjudication', total, realise: arrondi(total * 0.18 * v) };
  })),
  filtres: ['projet'],
  colonneDate: 'date',
});
