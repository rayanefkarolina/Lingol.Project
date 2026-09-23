// Contratos devolvidos pelas APIs .NET.

export type Papel = 'Professor' | 'Aluno';

export interface LoginProfessorResponse {
  accessToken: string;
  expiraEm: string;
  professorId: string;
  nomeProfessor: string;
  email: string;
}

export interface LoginAlunoResponse {
  accessToken: string;
  expiraEm: string;
  alunoId: string;
  turmaId: string;
  nomeAluno: string;
  matricula: string;
}

export interface Turma {
  id: string;
  nome: string;
  materia: string;
  ano: number;
  professorId: string;
}

export interface Aluno {
  id: string;
  nome: string;
  matricula: string;
  turmaId: string;
  tipoNecessidade: string | null;
}

export type StatusAtividade = 'Pendente' | 'Processando' | 'Pronta' | 'Erro';
export type ModoGamificacao = 'Simples' | 'Rpg';

export interface AtividadeResumo {
  id: string;
  livro: string;
  assunto: string;
  materia: string;
  modo: ModoGamificacao;
  tema: string;
  status: StatusAtividade;
  dataCriacao: string;
  numQuestoes: number;
}

export interface Atividade extends AtividadeResumo {
  turmaId: string;
  mensagemErro: string | null;
}

export interface Questao {
  id: string;
  ordem: number;
  enunciado: string;
  tipo: string;
  alternativas: string[];
}

export interface GerarAtividadeRequest {
  turmaId: string;
  livro: string;
  assunto: string;
  materia?: string;
  numQuestoes?: number;
  modo?: ModoGamificacao;
  tema?: string;
  perfilAeeContexto?: string;
}

/** Resposta de uma questão no ciclo de feedback imediato. */
export interface ResponderQuestaoResponse {
  estaCorreta: boolean;
  gabaritoOuCriterio: string;
  explicacao: string | null;
  acertos: number;
  respondidas: number;
  totalQuestoes: number;
}

export interface FinalizarAtividadeResponse {
  atividadeId: string;
  respostaAlunoId: string;
  acertos: number;
  erros: number;
  totalQuestoes: number;
  nota: number | null;
  mensagem: string;
}

export interface GerarAtividadeResponse {
  atividadeId: string;
  status: StatusAtividade;
  criadoEm: string;
  mensagem: string;
}

// ----- Relatórios -------------------------------------------------------

export type TipoDificuldade =
  | 'Interpretacao' | 'Ortografia' | 'Gramatica' | 'Vocabulario'
  | 'Coesao' | 'Pontuacao' | 'OrganizacaoTexto';

export interface DificuldadeResumo {
  tipo: TipoDificuldade | number;
  quantidade: number;
  questoesComDificuldade: string[];
}

export interface DificuldadeTurmaResumo {
  tipo: TipoDificuldade | number;
  quantidadeTotal: number;
  quantidadeAlunosAfetados: number;
  questoesComDificuldade: string[];
}

export interface QuestaoCritica {
  questaoId: string;
  atividadeId: string;
  ordem: number;
  enunciado: string;
  habilidade: string;
  respostas: number;
  erros: number;
  percentualErro: number;
}

export interface DificuldadePorAluno {
  alunoId: string;
  nomeAluno: string;
  perfilAee: string | null;
  entregou: boolean;
  atividadesEntregues: number;
  totalAcertos: number;
  totalErros: number;
  notaMedia: number | null;
  dificuldades: DificuldadeResumo[];
}

export interface RelatorioTurma {
  turmaId: string;
  nomeTurma: string;
  ano: number;
  totalAlunos: number;
  alunosQueEntregaram: number;
  atividadesPublicadas: number;
  notaMediaTurma: number | null;
  resumoTurma: DificuldadeTurmaResumo[];
  questoesMaisErradas: QuestaoCritica[];
  alunos: DificuldadePorAluno[];
}

export interface EntregaResumo {
  respostaAlunoId: string;
  atividadeId: string;
  assunto: string;
  acertos: number;
  erros: number;
  totalQuestoes: number;
  nota: number | null;
  dataEnvio: string;
  diagnosticoPronto: boolean;
  feedbackGeral: string | null;
}

export interface RelatorioAluno {
  turmaId: string;
  alunoId: string;
  nomeAluno: string;
  perfilAee: string | null;
  atividadesEntregues: number;
  totalAcertos: number;
  totalErros: number;
  notaMedia: number | null;
  dificuldades: DificuldadeResumo[];
  entregas: EntregaResumo[];
}

export interface QuestaoDesempenho {
  questaoId: string;
  ordem: number;
  enunciado: string;
  habilidade: string;
  acertos: number;
  erros: number;
  percentualAcerto: number;
}

export interface RelatorioAtividade {
  atividadeId: string;
  turmaId: string;
  livro: string;
  assunto: string;
  status: StatusAtividade;
  totalQuestoes: number;
  totalAlunos: number;
  entregas: number;
  notaMedia: number | null;
  questoes: QuestaoDesempenho[];
  resumoDificuldades: DificuldadeTurmaResumo[];
}

// Eventos do SignalR
export interface AtividadeGeradaEvento {
  atividadeId: string;
  status: string;
  numQuestoes: number;
  timestamp: string;
}

export interface AtividadeErroEvento {
  atividadeId: string;
  erro: string;
  timestamp: string;
}

export interface CorrecaoProntaEvento {
  atividadeId: string;
  alunoId: string;
  dificuldadesIdentificadas: number;
  timestamp: string;
}
