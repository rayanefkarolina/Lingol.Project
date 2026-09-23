/**
 * Um tema é só configuração: textos, ícones e arte. A mecânica do jogo
 * (fases, itens, avatar, modal de feedback) é a mesma para todos.
 * Para criar um tema novo, copie tema-fantasia.ts e registre em index.ts.
 */

export interface ItemTema {
  nome: string;
  /** Classe do Font Awesome, ex.: 'fa-khanda'. */
  icone: string;
}

export interface EstagioAvatar {
  /** Acertos mínimos para o avatar assumir esta forma. */
  minimo: number;
  icone: string;
  cor: string;
  brilho: string;
}

export interface TemaJogo {
  id: string;
  titulo: string;
  iconeTitulo: string;

  tituloAbertura: string;
  /** Recebe o total de fases, porque a atividade pode ter menos de 10 questões. */
  narrativa: (totalFases: number) => string;
  textoBotaoIniciar: string;

  rotuloFase: string;
  instrucaoQuestao: string;
  rotuloEnunciado: string;

  /** Até 10 itens — um por questão. */
  itens: ItemTema[];

  estagiosAvatar: EstagioAvatar[];
  avatarPadrao: EstagioAvatar;

  rotuloItemGanho: string;
  rotuloItemPerdido: string;
  mensagemAcerto: string;
  mensagemErro: string;

  tituloVitoria: string;
  textoVitoria: (acertos: number, total: number) => string;

  imagemFundo: string;
}
