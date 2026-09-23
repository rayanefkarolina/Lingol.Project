import { TEMA_FANTASIA } from './tema-fantasia';
import { TemaJogo } from './tema.model';

export * from './tema.model';
export { TEMA_FANTASIA };

/** Registro de temas. Um tema novo entra aqui e já aparece para o professor. */
export const TEMAS: Record<string, TemaJogo> = {
  [TEMA_FANTASIA.id]: TEMA_FANTASIA
};

export const TEMA_PADRAO = TEMA_FANTASIA;

export function obterTema(id: string | null | undefined): TemaJogo {
  if (!id) return TEMA_PADRAO;
  return TEMAS[id] ?? TEMA_PADRAO;
}
