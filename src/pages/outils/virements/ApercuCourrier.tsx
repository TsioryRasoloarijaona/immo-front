import type { ReactNode } from 'react';
import { formatDate, formatNumber } from '../../../lib/format';
import { cn } from '../../../lib/utils';
import type { Societe, TypeVirement } from './donnees';

export interface LigneCourrier {
  beneficiaire: string;
  rib: string;
  montant: number | null;
}

type Variables = Record<'societe' | 'compte' | 'montant' | 'beneficiaire', string>;

/** Remplace les `{variables}` d'un modèle, en gras celles que la société a
 * demandées. Les accolades inconnues restent telles quelles : c'est ce que
 * l'utilisateur a tapé, le corriger serait mentir sur le courrier. */
function remplir(modele: string, vars: Variables, gras: Set<keyof Variables>): ReactNode[] {
  return modele.split(/(\{\w+\})/g).map((morceau, i) => {
    const m = /^\{(\w+)\}$/.exec(morceau);
    if (!m || !(m[1] in vars)) return morceau;
    const cle = m[1] as keyof Variables;
    const valeur = vars[cle] || '…';
    return gras.has(cle) ? <strong key={i}>{valeur}</strong> : <span key={i}>{valeur}</span>;
  });
}

const POLICE: Record<Societe['police'], string> = {
  helvetica: 'Helvetica, Arial, sans-serif',
  times: '"Times New Roman", Times, serif',
};

/** Aperçu du courrier envoyé à la banque, construit depuis le modèle de la
 * société — un aperçu figé serait faux dès qu'on en change.
 *
 * **Le papier reste blanc en thème sombre**, volontairement : c'est l'image
 * d'une feuille imprimée, pas une surface d'interface. Les couleurs sont donc
 * fixes ici, hors des jetons. Proportions A4 (210 × 297). */
export default function ApercuCourrier({
  societe,
  type,
  lignes,
  date,
  reference,
  className,
}: {
  societe: Societe | undefined;
  type: TypeVirement;
  lignes: LigneCourrier[];
  date: string;
  reference?: string;
  className?: string;
}) {
  if (!societe) {
    return (
      <div className={cn('flex aspect-[210/297] w-full items-center justify-center rounded-sm bg-white text-[11px] text-neutral-500 shadow-md', className)}>
        Aucune société émettrice.
      </div>
    );
  }

  const gras = new Set<keyof Variables>([
    ...(societe.societeGrasse ? (['societe'] as const) : []),
    ...(societe.montantsGras ? (['montant', 'compte'] as const) : []),
    ...(societe.beneficiaireGras ? (['beneficiaire'] as const) : []),
  ]);
  const salaire = type === 'salaire';
  const corps = salaire ? societe.corpsSalaire : societe.corpsFournisseur;
  const modeleLigne = salaire ? societe.ligneSalaire : societe.ligneFournisseur;
  const lignesAffichees = lignes.length > 0 ? lignes : [{ beneficiaire: '', rib: '', montant: null }];
  const base: Variables = {
    societe: societe.nom,
    compte: societe.compte,
    montant: '',
    beneficiaire: lignesAffichees.length === 1 ? lignesAffichees[0].beneficiaire : '',
  };
  const signataireGauche = salaire && societe.signataireGauche.trim() ? societe.signataireGauche : '';

  return (
    <div
      className={cn('flex aspect-[210/297] w-full flex-col rounded-sm bg-white px-[8%] py-[7%] text-[10.5px] leading-[1.55] text-neutral-900 shadow-md', className)}
      style={{ fontFamily: POLICE[societe.police] }}
    >
      {societe.enteteMode === 'logo' && (
        <div className="mb-6 flex h-12 items-center justify-between rounded-sm border border-dashed border-neutral-300 bg-neutral-50 px-3">
          <span className="text-[15px] font-black tracking-tight">{societe.nom}</span>
          <span className="text-[9px] text-neutral-500">Logo de la société</span>
        </div>
      )}
      {societe.enteteMode === 'texte' && (
        <div className={cn('mb-6 flex items-start justify-between gap-4 pb-2', societe.enteteFilet && 'border-b border-neutral-800')}>
          <div className="min-w-0">
            <div className="font-bold leading-tight whitespace-pre-line" style={{ fontSize: `${Math.max(8, Math.min(48, societe.enteteTaille)) * 0.62}px` }}>
              {societe.enteteTitre || societe.nom}
            </div>
            {societe.enteteSousTitre && <div className="text-[9px] whitespace-pre-line text-neutral-600">{societe.enteteSousTitre}</div>}
          </div>
          {societe.enteteDroite && <div className="shrink-0 text-right text-[9px] whitespace-pre-line text-neutral-600">{societe.enteteDroite}</div>}
        </div>
      )}

      <div className="text-right">
        {societe.ville ? `${capitaliser(societe.ville)}, le ` : 'Le '}
        {date ? formatDate(date) : '…'}
      </div>

      <div className="mt-4 ml-auto w-1/2">
        <div>À Monsieur le Directeur</div>
        <div className="font-bold">{societe.banque || '…'}</div>
        <div>{societe.ville}</div>
      </div>

      <div className="mt-5">
        <span className="font-bold underline">Objet :</span> {societe.objet}
        {reference && <div className="text-neutral-700">Réf. : {reference}</div>}
      </div>

      <p className={cn('mt-4', societe.salutationGrasse && 'font-bold')}>Madame, Monsieur,</p>
      <p className="mt-2 text-justify">{remplir(corps, base, gras)}</p>

      <ul className="mt-3 flex flex-col gap-1.5 pl-4">
        {lignesAffichees.map((l, i) => {
          const vars: Variables = {
            ...base,
            beneficiaire: l.beneficiaire,
            montant: l.montant != null && l.montant > 0 ? formatNumber(l.montant, 2) : '',
          };
          return (
            <li key={i} className="list-disc">
              {remplir(modeleLigne, vars, gras)}
              <div className="text-neutral-700">
                RIB : {societe.montantsGras ? <strong>{l.rib || '…'}</strong> : l.rib || '…'}
              </div>
            </li>
          );
        })}
      </ul>

      {lignesAffichees.length > 1 && (
        <p className="mt-2">
          Soit un total de{' '}
          <strong>{formatNumber(lignesAffichees.reduce((s, l) => s + (l.montant ?? 0), 0), 2)} DH</strong>.
        </p>
      )}

      {societe.cloture && (
        <p className="mt-4 text-justify">
          Nous vous en remercions par avance et vous prions d'agréer, Madame, Monsieur, l'expression de nos salutations
          distinguées.
        </p>
      )}

      <div className={cn('mt-8 flex', signataireGauche ? 'justify-between' : 'justify-end')}>
        {signataireGauche && (
          <div className="text-center">
            <div>{remplir(signataireGauche, base, gras)}</div>
            <div className="mt-8 text-[9px] text-neutral-500">Signature</div>
          </div>
        )}
        <div className="text-center">
          <div className="font-bold">{societe.signataire}</div>
          <div className="mt-8 text-[9px] text-neutral-500">Signature et cachet</div>
        </div>
      </div>

      {societe.pied && <div className="mt-auto border-t border-neutral-300 pt-2 text-center text-[8.5px] whitespace-pre-line text-neutral-600">{societe.pied}</div>}
    </div>
  );
}

function capitaliser(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}
