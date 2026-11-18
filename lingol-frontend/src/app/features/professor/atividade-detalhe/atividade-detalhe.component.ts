import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AtividadeService, RelatorioService, TurmaService } from '../../../core/lingol-api.service';
import { Atividade, Questao, RelatorioAtividade, Turma } from '../../../core/models';

@Component({
  selector: 'app-atividade-detalhe',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './atividade-detalhe.component.html'
})
export class AtividadeDetalheComponent {
  private rota = inject(ActivatedRoute);
  private router = inject(Router);
  private atividadeService = inject(AtividadeService);
  private relatorioService = inject(RelatorioService);
  private turmaService = inject(TurmaService);

  atividadeId = this.rota.snapshot.paramMap.get('atividadeId')!;

  atividade = signal<Atividade | null>(null);
  questoes = signal<Questao[]>([]);
  relatorio = signal<RelatorioAtividade | null>(null);
  turma = signal<Turma | null>(null);
  carregando = signal(true);
  excluindo = signal(false);
  mensagemErro = signal('');

  constructor() {
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);

    this.atividadeService.obter(this.atividadeId).subscribe({
      next: a => {
        this.atividade.set(a);
        this.carregando.set(false);
        this.turmaService.obter(a.turmaId).subscribe({
          next: turma => this.turma.set(turma)
        });

        if (a.status === 'Pronta') {
          this.atividadeService.obterQuestoes(this.atividadeId).subscribe({
            next: q => this.questoes.set(q)
          });

          this.relatorioService.daAtividade(this.atividadeId).subscribe({
            next: r => this.relatorio.set(r)
          });
        }
      },
      error: () => this.carregando.set(false)
    });
  }

  /** Verde quando a turma foi bem, vermelho quando travou. */
  corDoDesempenho(percentual: number): string {
    if (percentual >= 70) return 'bg-green-500';
    if (percentual >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  }

  excluir(): void {
    const atividade = this.atividade();
    if (!atividade || this.excluindo()) return;

    const confirmacao = window.confirm(
      'Excluir esta atividade e as revisões vinculadas para toda a turma? Respostas e resultados também serão removidos.');
    if (!confirmacao) return;

    this.excluindo.set(true);
    this.mensagemErro.set('');

    this.atividadeService.excluir(this.atividadeId).subscribe({
      next: () => this.router.navigate(['/professor/turmas', atividade.turmaId]),
      error: erro => {
        this.mensagemErro.set(erro.error?.erro ?? 'Não foi possível excluir a atividade.');
        this.excluindo.set(false);
      }
    });
  }
}
