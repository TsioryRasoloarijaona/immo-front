import type { ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { EmptyState } from '../ui';
import EcranBordStatique from './EcranBordStatique';
import EcranListeStatique from './EcranListeStatique';
import type { ConfigBord, ConfigEcran } from './types';

export interface EcransModule {
  listes: Record<string, ConfigEcran>;
  tableaux: Record<string, ConfigBord>;
  libres: Record<string, ReactNode>;
}

/** Route unique `<base>/:ecran/:id?` d'un module : choisit le gabarit et la configuration de l'écran demandé. */
export default function EcranMaquette({ base, ecrans }: Readonly<{ base: string; ecrans: EcransModule }>) {
  const { ecran = '' } = useParams();
  const chemin = `${base}/${ecran}`;
  if (ecran in ecrans.listes) return <EcranListeStatique key={ecran} config={ecrans.listes[ecran]} chemin={chemin} />;
  if (ecran in ecrans.tableaux) return <EcranBordStatique key={ecran} config={ecrans.tableaux[ecran]} cle={chemin.slice(1).replaceAll('/', '.')} />;
  if (ecran in ecrans.libres) return <>{ecrans.libres[ecran]}</>;
  return <EmptyState title="Écran introuvable" message="Cet écran de la maquette n'existe pas." />;
}
