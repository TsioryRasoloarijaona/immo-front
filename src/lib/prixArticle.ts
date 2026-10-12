// Aperçu en direct des prix pendant la saisie (FEATURE-patrimoine-ecriture.md §5.5). Le serveur recalcule et
// stocke les prix à l'enregistrement : ces valeurs ne sont jamais envoyées.

export interface EntreesPrixArticle {
  surfaceProvisoire?: number;
  surfaceDefinitive?: number;
  prixM2ProvisoireHT?: number;
  prixM2DefinitifHT?: number;
  /** Fraction (0.2 = 20 %). */
  tauxTva?: number;
}

export interface PrixCalcules {
  m2ProvisoireTTC: number;
  m2DefinitifTTC: number;
  articleProvisoireHT: number;
  articleProvisoireTTC: number;
  articleDefinitifHT: number;
  articleDefinitifTTC: number;
}

// Même échelle qu'OMRAN : le TTC au m² est arrondi avant d'être multiplié par la surface.
const arrondi6 = (n: number) => Math.round(n * 1e6) / 1e6;

export function calculerPrixArticle(e: EntreesPrixArticle): PrixCalcules {
  const coefficient = 1 + (e.tauxTva ?? 0);
  const surfaceProvisoire = e.surfaceProvisoire ?? 0;
  // Définitive absente = provisoire, comme le serveur à la création.
  const surfaceDefinitive = e.surfaceDefinitive ?? surfaceProvisoire;
  const m2ProvisoireTTC = arrondi6((e.prixM2ProvisoireHT ?? 0) * coefficient);
  const m2DefinitifTTC = arrondi6((e.prixM2DefinitifHT ?? 0) * coefficient);
  return {
    m2ProvisoireTTC,
    m2DefinitifTTC,
    articleProvisoireHT: arrondi6((e.prixM2ProvisoireHT ?? 0) * surfaceProvisoire),
    articleProvisoireTTC: arrondi6(m2ProvisoireTTC * surfaceProvisoire),
    articleDefinitifHT: arrondi6((e.prixM2DefinitifHT ?? 0) * surfaceDefinitive),
    articleDefinitifTTC: arrondi6(m2DefinitifTTC * surfaceDefinitive),
  };
}
