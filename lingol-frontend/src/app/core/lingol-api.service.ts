import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Aluno, Atividade, AtividadeResumo, FinalizarAtividadeResponse, GerarAtividadeRequest,
  GerarAtividadeResponse, Questao, RelatorioAluno, RelatorioAtividade, RelatorioTurma,
  ResponderQuestaoResponse, Turma
} from './models';

/** Microsserviço de Cadastro: professores, turmas e alunos. */
@Injectable({ providedIn: 'root' })
export class TurmaService {
  private http = inject(HttpClient);
  private base = `${environment.cadastroApi}/api`;

  listar(): Observable<Turma[]> {
    return this.http.get<Turma[]>(`${this.base}/turmas`);
  }

  obter(turmaId: string): Observable<Turma> {
    return this.http.get<Turma>(`${this.base}/turmas/${turmaId}`);
  }

  criar(nome: string, materia: string, ano: number): Observable<Turma> {
    return this.http.post<Turma>(`${this.base}/turmas`, { nome, materia, ano });
  }

  listarAlunos(turmaId: string): Observable<Aluno[]> {
    return this.http.get<Aluno[]>(`${this.base}/turmas/${turmaId}/alunos`);
  }

  cadastrarAluno(
    turmaId: string,
    nome: string,
    matricula: string,
    tipoNecessidadeAee?: string,
    observacoesAee?: string
  ): Observable<Aluno> {
    return this.http.post<Aluno>(`${this.base}/turmas/${turmaId}/alunos`, {
      nome, matricula, tipoNecessidadeAee, observacoesAee
    });
  }

  /** Turma do aluno logado. */
  minhasTurmas(): Observable<Turma[]> {
    return this.http.get<Turma[]>(`${this.base}/turmas/minhas`);
  }
}

/** Microsserviço Pedagógico: atividades e respostas. */
@Injectable({ providedIn: 'root' })
export class AtividadeService {
  private http = inject(HttpClient);
  private base = `${environment.pedagogicoApi}/api/atividades`;

  /** Devolve 202: a geração continua em segundo plano. */
  gerar(request: GerarAtividadeRequest): Observable<GerarAtividadeResponse> {
    return this.http.post<GerarAtividadeResponse>(`${this.base}/gerar`, request);
  }

  listarPorTurma(turmaId: string): Observable<AtividadeResumo[]> {
    return this.http.get<AtividadeResumo[]>(`${this.base}/turmas/${turmaId}`);
  }

  obter(atividadeId: string): Observable<Atividade> {
    return this.http.get<Atividade>(`${this.base}/${atividadeId}`);
  }

  obterQuestoes(atividadeId: string): Observable<Questao[]> {
    return this.http.get<Questao[]>(`${this.base}/${atividadeId}/questoes`)
      .pipe(map(questoes => questoes.map(q => ({
        ...q,
        // A interface numera A/B/C/D sozinha. Se a IA mandar o rótulo junto,
        // remover aqui evita o "A) A) gato" na tela.
        alternativas: q.alternativas.map(a => a.replace(/^\s*[A-Da-d]\s*[\)\.\-]\s*/, ''))
      }))));
  }

  /**
   * Envia UMA resposta e recebe na hora se acertou, com a explicação da regra.
   * Cada questão aceita uma única tentativa.
   */
  responderQuestao(
    atividadeId: string,
    questaoId: string,
    respostaEscolhida: string,
    tempoSegundos: number
  ): Observable<ResponderQuestaoResponse> {
    return this.http.post<ResponderQuestaoResponse>(
      `${this.base}/${atividadeId}/respostas/questao`,
      { questaoId, respostaEscolhida, tempoSegundos });
  }

  /** Fecha a entrega e dispara o diagnóstico pedagógico em segundo plano. */
  finalizar(atividadeId: string): Observable<FinalizarAtividadeResponse> {
    return this.http.post<FinalizarAtividadeResponse>(`${this.base}/${atividadeId}/finalizar`, {});
  }
}

/** Dashboard diagnóstico. */
@Injectable({ providedIn: 'root' })
export class RelatorioService {
  private http = inject(HttpClient);
  private base = `${environment.pedagogicoApi}/api/relatorios`;

  daTurma(turmaId: string): Observable<RelatorioTurma> {
    return this.http.get<RelatorioTurma>(`${this.base}/turmas/${turmaId}`);
  }

  doAluno(turmaId: string, alunoId: string): Observable<RelatorioAluno> {
    return this.http.get<RelatorioAluno>(`${this.base}/turmas/${turmaId}/alunos/${alunoId}`);
  }

  daAtividade(atividadeId: string): Observable<RelatorioAtividade> {
    return this.http.get<RelatorioAtividade>(`${this.base}/atividades/${atividadeId}`);
  }
}
