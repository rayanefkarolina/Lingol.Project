import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AtividadeService, TurmaService } from '../../../core/lingol-api.service';
import { AuthService } from '../../../core/auth.service';
import { AtividadeResumo, Turma } from '../../../core/models';

@Component({
  selector: 'app-aluno-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html'
})
export class AlunoHomeComponent {
  private turmaService = inject(TurmaService);
  private atividadeService = inject(AtividadeService);
  auth = inject(AuthService);

  turma = signal<Turma | null>(null);
  atividades = signal<AtividadeResumo[]>([]);
  carregando = signal(true);
  mensagemErro = signal('');

  constructor() {
    const turmaId = this.auth.usuario()?.turmaId;
    if (!turmaId) {
      this.mensagemErro.set('Sua matrícula não está vinculada a uma turma.');
      this.carregando.set(false);
      return;
    }

    this.turmaService.minhasTurmas().subscribe({
      next: turmas => this.turma.set(turmas[0] ?? null)
    });

    this.atividadeService.listarPorTurma(turmaId).subscribe({
      next: atividades => {
        // O aluno só vê o que a IA já terminou de gerar.
        this.atividades.set(atividades.filter(a => a.status === 'Pronta'));
        this.carregando.set(false);
      },
      error: () => {
        this.mensagemErro.set('Não foi possível carregar suas atividades.');
        this.carregando.set(false);
      }
    });
  }

  /** Cada modo tem a sua própria tela. */
  rotaDaAtividade(atividade: AtividadeResumo): string[] {
    return atividade.modo === 'Rpg'
      ? ['/aluno/jogo', atividade.id]
      : ['/aluno/atividades', atividade.id];
  }
}
