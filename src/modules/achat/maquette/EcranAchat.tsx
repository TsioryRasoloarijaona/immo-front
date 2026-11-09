import EcranMaquette, { type EcransModule } from '../../../components/maquette/EcranMaquette';
import { CONFIG_FOURNISSEURS } from '../../../components/maquette/communes';
import { CONFIG_ACHAT } from './ecransConfig';
import { configARegler, configAvoirs, configCommandes, configDevis, configFactures, configHistorique, configImpayes, configLivraisons, configVirements } from './ecransDocuments';
import {
  bordRs, bordTva, configConsultations, configEcheances, configPrets, configRapportsAchat, configReglements, configSoldes,
} from './ecransFinance';

const ECRANS: EcransModule = {
  listes: {
    consultations: configConsultations,
    devis: configDevis,
    'bons-commande': configCommandes,
    'bons-livraison': configLivraisons,
    factures: configFactures,
    'documents-a-regler': configARegler,
    avoirs: configAvoirs,
    reglements: configReglements,
    virements: configVirements,
    impayes: configImpayes,
    documents: configHistorique,
    prets: configPrets,
    echeances: configEcheances,
    soldes: configSoldes,
    rapports: configRapportsAchat,
    fournisseurs: CONFIG_FOURNISSEURS,
    ...CONFIG_ACHAT,
  },
  tableaux: { tva: bordTva, rs: bordRs },
  libres: {},
};

/** Route unique `/achat/:ecran/:id?` du module Achat. */
export default function EcranAchat() {
  return <EcranMaquette base="/achat" ecrans={ECRANS} />;
}
