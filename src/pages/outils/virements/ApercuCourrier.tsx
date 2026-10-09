import { Fragment, type ReactNode } from 'react';
import { formatDate, formatNumber } from '../../../lib/format';
import { LIEN_LOGO_DEFAUT, lienLogoSociete } from '../../../lib/virements';
import { cn } from '../../../lib/utils';
import type { Societe, TypeVirement } from './types';

export interface LigneCourrier {
  beneficiaire: string;
  rib: string;
  montant: number | null;
}

type Jeton = 'societe' | 'compte' | 'montant' | 'beneficiaire';

/** Un jeton inconnu reste tel quel : c'est ce que l'utilisateur a tapé, et le service l'imprimera ainsi. */
function remplir(modele: string, valeurs: Partial<Record<Jeton, string>>, gras: Set<Jeton>): ReactNode[] {
  return modele.split(/(\{\w+\})/g).map((morceau, i) => {
    const m = /^\{(\w+)\}$/.exec(morceau);
    if (!m || !(m[1] in valeurs)) return <Fragment key={i}>{morceau}</Fragment>;
    const cle = m[1] as Jeton;
    const v = valeurs[cle] ?? '';
    return gras.has(cle) ? <strong key={i}>{v}</strong> : <span key={i}>{v}</span>;
  });
}

const POLICE: Record<Societe['police'], string> = {
  helvetica: 'Helvetica, Arial, sans-serif',
  times: '"Times New Roman", Times, serif',
};

const montantTexte = (m: number | null) => (m != null && m > 0 ? formatNumber(m, 2) : '…');

function EnteteCourrier({ societe, logoSrc }: Readonly<{ societe: Societe; logoSrc?: string }>) {
  if (societe.entete_mode === 'logo') {
    return (
      <img
        src={logoSrc ?? (societe.logo ? lienLogoSociete(societe.id, societe.updated_at) : LIEN_LOGO_DEFAUT)}
        alt={`En-tête ${societe.nom}`}
        className={cn('max-h-[14%] w-full object-contain object-left', societe.entete_filet ? 'border-b border-neutral-800 pb-1' : '')}
      />
    );
  }
  if (societe.entete_mode === 'texte') {
    return (
      <div className={cn('flex items-start justify-between gap-4 pb-1', societe.entete_filet ? 'border-b border-neutral-800' : '')}>
        <div className="min-w-0">
          {societe.entete_titre && (
            <div className="leading-tight font-bold whitespace-pre-line" style={{ fontSize: `${societe.entete_taille * 0.875}px` }}>
              {societe.entete_titre}
            </div>
          )}
          {societe.entete_sous_titre && <div className="text-[7.9px] whitespace-pre-line">{societe.entete_sous_titre}</div>}
        </div>
        {societe.entete_droite && <div className="shrink-0 text-right text-[7px] whitespace-pre-line">{societe.entete_droite}</div>}
      </div>
    );
  }
  // Mode « aucun » : le filet est tracé quand même, sans en-tête (courrier.js).
  if (societe.entete_filet) return <div className="border-b border-neutral-800" />;
  return null;
}

/** Doit suivre le modèle du PDF construit par le service (`src/pdf/courrier.js`), format Letter.
 * Le papier reste blanc en thème sombre, volontairement : c'est une feuille imprimée, pas une surface d'interface. */
export default function ApercuCourrier({
  societe,
  type,
  lignes,
  date,
  reference,
  logoSrc,
  className,
}: Readonly<{
  societe: Societe | undefined;
  /** Pour un logo choisi mais pas encore déposé ; sinon logo servi par le service, ou celui par défaut. */
  logoSrc?: string;
  type: TypeVirement;
  lignes: LigneCourrier[];
  date: string;
  reference?: string;
  className?: string;
}>) {
  const papier = 'flex aspect-[2159/2794] w-full flex-col rounded-sm bg-white text-[10.5px] leading-[1.5] text-neutral-900 shadow-md';
  if (!societe) {
    return <div className={cn(papier, 'items-center justify-center text-neutral-500', className)}>Aucune société émettrice.</div>;
  }

  const gras = new Set<Jeton>([
    ...(societe.societe_grasse ? (['societe'] as const) : []),
    ...(societe.montants_gras ? (['montant', 'compte'] as const) : []),
    ...(societe.beneficiaire_gras ? (['beneficiaire'] as const) : []),
  ]);
  const salaire = type === 'salaire';
  const affichees = lignes.length > 0 ? lignes : [{ beneficiaire: '', rib: '', montant: null }];
  const nom = (l: LigneCourrier) => l.beneficiaire.trim() || '—';
  const total = affichees.reduce((s, l) => s + (l.montant ?? 0), 0);
  const corps = remplir(
    salaire ? societe.phrase_corps_salaire : societe.phrase_corps,
    {
      societe: societe.nom,
      compte: societe.compte,
      montant: total > 0 ? formatNumber(total, 2) : '…',
      beneficiaire: affichees.map(nom).join(', '),
    },
    gras,
  );
  const gauche =
    salaire && affichees.length === 1 && societe.signataire_gauche?.trim()
      ? remplir(societe.signataire_gauche, { societe: societe.nom, compte: societe.compte, beneficiaire: nom(affichees[0]), montant: montantTexte(affichees[0].montant) }, gras)
      : null;

  return (
    <div className={cn(papier, 'px-[11.6%] py-[9%]', className)} style={{ fontFamily: POLICE[societe.police] }}>
      <EnteteCourrier societe={societe} logoSrc={logoSrc} />

      <div className="mt-5 text-right">
        <div>{societe.banque}</div>
        <div>
          {societe.ville}, Le {date ? formatDate(date) : '…'}
        </div>
      </div>

      <p className="mt-5 underline">
        Objet : {societe.objet}
        {reference && (
          <>
            {' '}
            <strong>({reference})</strong>
          </>
        )}
      </p>

      <p className={cn('mt-4', societe.salutation_grasse ? 'font-bold' : '')}>Madame, Monsieur,</p>
      <p className="mt-2 text-justify">{corps}</p>

      <ul className="mt-2 flex flex-col gap-1">
        {affichees.map((l, i) => (
          <li key={i}>
            •{' '}
            {remplir(
              salaire ? societe.phrase_ligne_salaire : societe.phrase_ligne,
              { societe: societe.nom, compte: societe.compte, montant: montantTexte(l.montant), beneficiaire: nom(l) },
              gras,
            )}
            <div className="pl-[6%]">RIB : {societe.montants_gras ? <strong>{l.rib || '…'}</strong> : l.rib || '…'}</div>
          </li>
        ))}
      </ul>

      {societe.avec_cloture ? (
        <p className="mt-4 text-justify">
          En vous remerciant de l'attention que vous voudrez bien porter à ma demande. Je vous prie d'agréer,{' '}
          <strong>Madame, Monsieur</strong>, l'expression de mes salutations distinguées.
        </p>
      ) : null}

      <div className={cn('mt-10 flex', gauche ? 'justify-between' : 'justify-end')}>
        {gauche && (
          <div className="w-[27%] text-center">
            <div className="border-t border-neutral-800 pt-1">{gauche}</div>
          </div>
        )}
        <div className="w-[27%] text-center">
          <div className="border-t border-neutral-800 pt-1">{societe.signataire}</div>
        </div>
      </div>

      {societe.pied_page && <div className="mt-auto pt-3 text-center text-[8.75px] whitespace-pre-line">{societe.pied_page}</div>}
    </div>
  );
}
