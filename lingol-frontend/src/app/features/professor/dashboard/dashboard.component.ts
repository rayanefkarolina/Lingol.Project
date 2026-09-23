import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/auth.service';
import { TurmaService } from '../../../core/lingol-api.service';
import { Turma } from '../../../core/models';

@Component({
  selector: 'app-dashboard-professor',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './dashboard.component.html'
})
export class DashboardProfessorComponent {
  private turmaService = inject(TurmaService);
  auth = inject(AuthService);

  turmas = signal<Turma[]>([]);
  carregando = signal(true);
  mensagemErro = signal('');

  mostrarFormulario = signal(false);
  salvando = signal(false);
  nova = { nome: '', materia: 'Língua Portuguesa', ano: 6 };

  readonly anos = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  constructor() {
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.turmaService.listar().subscribe({
      next: turmas => {
        this.turmas.set(turmas);
        this.carregando.set(false);
      },
      error: () => {
        this.mensagemErro.set('Não foi possível carregar suas turmas.');
        this.carregando.set(false);
      }
    });
  }

  criarTurma(): void {
    if (!this.nova.nome.trim()) {
      this.mensagemErro.set('Dê um nome para a turma.');
      return;
    }

    this.salvando.set(true);
    this.mensagemErro.set('');

    this.turmaService.criar(this.nova.nome.trim(), this.nova.materia, this.nova.ano).subscribe({
      next: turma => {
        this.turmas.update(lista => [...lista, turma]);
        this.nova = { nome: '', materia: 'Língua Portuguesa', ano: 6 };
        this.mostrarFormulario.set(false);
        this.salvando.set(false);
      },
      error: () => {
        this.mensagemErro.set('Não foi possível criar a turma.');
        this.salvando.set(false);
      }
    });
  }
}
