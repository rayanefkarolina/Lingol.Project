import { TemaJogo } from './tema.model';

/** Lingolgard — tema de fantasia medieval. */
export const TEMA_FANTASIA: TemaJogo = {
  id: 'Fantasia',
  titulo: 'LINGOLGARD',
  iconeTitulo: 'fa-dragon',

  tituloAbertura: 'A Névoa do Esquecimento',
  narrativa: (totalFases: number) =>
    `"Guerreiro! Uma terrível maldição embaralhou as palavras do nosso reino. As frases não ` +
    `fazem mais sentido e perderam sua conexão!\n\n` +
    `Para restaurar a ordem, você passará por ${totalFases} ` +
    `${totalFases === 1 ? 'fase' : 'fases'} de desafios. Reúna os ${totalFases} ` +
    `${totalFases === 1 ? 'item místico' : 'itens místicos'} escolhendo as palavras corretas, ` +
    `e juntos eles farão nossa guilda vencer a batalha!"`,
  textoBotaoIniciar: 'Iniciar Jornada',

  rotuloFase: 'FASE',
  instrucaoQuestao: 'Guerreiro, escolha a palavra correta para preencher a lacuna:',
  rotuloEnunciado: 'Frase Desajustada:',

  itens: [
    { nome: 'Espada Longa', icone: 'fa-khanda' },
    { nome: 'Machado de Batalha', icone: 'fa-hammer' },
    { nome: 'Lança', icone: 'fa-wand-magic-sparkles' },
    { nome: 'Armadura Corporal', icone: 'fa-shirt' },
    { nome: 'Escudo de Proteção', icone: 'fa-shield-halved' },
    { nome: 'Manoplas de Ferro', icone: 'fa-mitten' },
    { nome: 'Poção de Cura', icone: 'fa-flask' },
    { nome: 'Talismã de Proteção', icone: 'fa-gem' },
    { nome: 'Pedra de Amolar', icone: 'fa-cube' },
    { nome: 'Amuleto de Força e Velocidade', icone: 'fa-medal' }
  ],

  // Avaliado do maior para o menor: o primeiro que couber vence.
  estagiosAvatar: [
    { minimo: 10, icone: 'fa-user-ninja', cor: 'text-game-gold', brilho: 'drop-shadow-[0_0_30px_rgba(255,215,0,1)] animate-pulse' },
    { minimo: 7, icone: 'fa-user-ninja', cor: 'text-game-gold', brilho: 'drop-shadow-[0_0_20px_rgba(255,215,0,0.8)]' },
    { minimo: 4, icone: 'fa-user-astronaut', cor: 'text-blue-400', brilho: 'drop-shadow-[0_0_15px_rgba(96,165,250,0.8)]' }
  ],
  avatarPadrao: { minimo: 0, icone: 'fa-user-shield', cor: 'text-gray-200', brilho: 'drop-shadow-2xl' },

  rotuloItemGanho: 'Novo Item Conquistado!',
  rotuloItemPerdido: 'Recompensa Perdida',
  mensagemAcerto: 'Você garantiu essa peça para a guilda!',
  mensagemErro: 'Não foi dessa vez... mas não desista, guerreiro! A Névoa permanece forte nesta fase.',

  tituloVitoria: 'Batalha Vencida!',
  textoVitoria: (acertos: number, total: number) =>
    acertos === total
      ? `Todos os ${total} itens foram forjados e reunidos! A Névoa do Esquecimento foi dissipada ` +
        `e você recuperou os tesouros do reino!`
      : `Você forjou ${acertos} de ${total} itens. A Névoa recuou, mas parte do reino ainda ` +
        `precisa de você — treine as regras e volte mais forte!`,

  imagemFundo:
    'https://img.freepik.com/free-vector/dark-castle-interior-with-arched-windows-night_107791-17482.jpg'
};
