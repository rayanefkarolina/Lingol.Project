import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AtividadeService, RelatorioService } from '../../../core/lingol-api.service';
import { Atividade, Questao, RelatorioAtividade } from '../../../core/models';

@Component({
  selector: 'app-atividade-detalhe',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './atividade-detalhe.component.html'
})
export class AtividadeDetalheComponent {
  private rota = inject(ActivatedRoute);
  private atividadeService = inject(AtividadeService);
  private relatorioService = inject(RelatorioService);

  atividadeId = this.rota.snapshot.paramMap.get('atividadeId')!;

  atividade = signal<Atividade | null>(null);
  questoes = signal<Questao[]>([]);
  relatorio = signal<RelatorioAtividade | null>(null);
  carregando = signal(true);

  constructor() {
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);

    this.atividadeService.obter(this.atividadeId).subscribe({
      next: a => {
        this.atividade.set(a);
        this.carregando.set(false);

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
}
