import { Component, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { AtividadeService, RelatorioService } from '../../../core/lingol-api.service';
import { SignalRService } from '../../../core/signalr.service';
import {
  DificuldadePorAluno, EntregaResumo, RelatorioAluno, RelatorioTurma, TipoDificuldade
} from '../../../core/models';

/** O enum chega como string quando configurado, ou índice quando serializado como número. */
const ROTULOS: Record<string, string> = {
  Interpretacao: 'Interpretação',
  Ortografia: 'Ortografia',
  Gramatica: 'Gramática',
  Vocabulario: 'Vocabulário',
  Coesao: 'Coesão',
  Pontuacao: 'Pontuação',
  OrganizacaoTexto: 'Organização do texto',
  '0': 'Interpretação',
  '1': 'Ortografia',
  '2': 'Gramática',
  '3': 'Vocabulário',
  '4': 'Coesão',
  '5': 'Pontuação',
  '6': 'Organização do texto'
};

@Component({
  selector: 'app-relatorio-turma',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './relatorio-turma.component.html'
})
export class RelatorioTurmaComponent implements OnDestroy {
  private rota = inject(ActivatedRoute);
  private relatorioService = inject(RelatorioService);
  private atividadeService = inject(AtividadeService);
  private signalR = inject(SignalRService);

  private assinaturas: Subscription[] = [];

  turmaId = this.rota.snapshot.paramMap.get('turmaId')!;

  relatorio = signal<RelatorioTurma | null>(null);
  carregando = signal(true);
  mensagemErro = signal('');

  alunoSelecionado = signal<RelatorioAluno | null>(null);
  carregandoAluno = signal(false);

  /** Revisões em andamento, por entrega, para travar o botão e dar retorno. */
  gerandoRevisao = signal<Record<string, boolean>>({});
  revisaoCriada = signal<Record<string, string>>({});

  constructor() {
    this.carregar();
    this.ouvirCorrecoes();
  }

  ngOnDestroy(): void {
    this.assinaturas.forEach(a => a.unsubscribe());
    this.signalR.sairDaTurma(this.turmaId);
  }

  /** O diagnóstico roda em segundo plano: o painel se atualiza sozinho quando termina. */
  private async ouvirCorrecoes(): Promise<void> {
    try {
      await this.signalR.entrarNaTurma(this.turmaId);
    } catch {
      return;
    }

    this.assinaturas.push(
      this.signalR.correcaoPronta$.subscribe(() => this.carregar())
    );
  }

  carregar(): void {
    this.relatorioService.daTurma(this.turmaId).subscribe({
      next: r => {
        this.relatorio.set(r);
        this.carregando.set(false);
      },
      error: () => {
        this.mensagemErro.set('Não foi possível carregar o dashboard.');
        this.carregando.set(false);
      }
    });
  }

  abrirAluno(aluno: DificuldadePorAluno): void {
    if (this.alunoSelecionado()?.alunoId === aluno.alunoId) {
      this.alunoSelecionado.set(null);
      return;
    }

    this.carregandoAluno.set(true);
    this.relatorioService.doAluno(this.turmaId, aluno.alunoId).subscribe({
      next: r => {
        this.alunoSelecionado.set(r);
        this.carregandoAluno.set(false);
      },
      error: () => this.carregandoAluno.set(false)
    });
  }

  /**
   * Gera uma atividade de reforço só para este aluno, focada no que a IA
   * diagnosticou nesta entrega. Cada aluno erra algo diferente, então a
   * revisão não vai para a turma inteira.
   */
  gerarRevisao(entrega: EntregaResumo, alunoId: string): void {
    if (this.gerandoRevisao()[entrega.respostaAlunoId]) return;

    this.gerandoRevisao.update(m => ({ ...m, [entrega.respostaAlunoId]: true }));

    this.atividadeService.gerarRevisao(entrega.atividadeId, alunoId).subscribe({
      next: () => {
        this.gerandoRevisao.update(m => ({ ...m, [entrega.respostaAlunoId]: false }));
        this.revisaoCriada.update(m => ({
          ...m,
          [entrega.respostaAlunoId]: 'Revisão enviada! Ela aparece para o aluno quando a IA terminar.'
        }));
      },
      error: erro => {
        this.gerandoRevisao.update(m => ({ ...m, [entrega.respostaAlunoId]: false }));
        this.revisaoCriada.update(m => ({
          ...m,
          [entrega.respostaAlunoId]: erro.error?.erro ?? 'Não foi possível gerar a revisão.'
        }));
      }
    });
  }

  rotulo(tipo: TipoDificuldade | number): string {
    return ROTULOS[String(tipo)] ?? String(tipo);
  }

  corDaNota(nota: number | null): string {
    if (nota === null) return 'text-gray-400';
    if (nota >= 7) return 'text-green-600';
    if (nota >= 5) return 'text-amber-600';
    return 'text-red-600';
  }
}
