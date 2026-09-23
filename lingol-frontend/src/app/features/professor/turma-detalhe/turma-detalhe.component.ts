import { Component, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { AtividadeService, TurmaService } from '../../../core/lingol-api.service';
import { SignalRService } from '../../../core/signalr.service';
import { Aluno, AtividadeResumo, Turma } from '../../../core/models';

@Component({
  selector: 'app-turma-detalhe',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './turma-detalhe.component.html'
})
export class TurmaDetalheComponent implements OnDestroy {
  private rota = inject(ActivatedRoute);
  private turmaService = inject(TurmaService);
  private atividadeService = inject(AtividadeService);
  private signalR = inject(SignalRService);

  private assinaturas: Subscription[] = [];

  turmaId = this.rota.snapshot.paramMap.get('turmaId')!;

  turma = signal<Turma | null>(null);
  alunos = signal<Aluno[]>([]);
  atividades = signal<AtividadeResumo[]>([]);
  carregando = signal(true);
  mensagemErro = signal('');

  mostrarFormulario = signal(false);
  salvando = signal(false);
  novoAluno = { nome: '', matricula: '', tipoNecessidadeAee: '', observacoesAee: '' };

  readonly perfisAee = ['TDAH', 'TEA', 'Dislexia', 'Deficiência intelectual', 'Outro'];

  constructor() {
    this.carregar();
    this.ouvirEventos();
  }

  ngOnDestroy(): void {
    this.assinaturas.forEach(a => a.unsubscribe());
    this.signalR.sairDaTurma(this.turmaId);
  }

  private async ouvirEventos(): Promise<void> {
    try {
      await this.signalR.entrarNaTurma(this.turmaId);
    } catch {
      // Sem tempo real a tela continua utilizável; o professor só precisa recarregar.
      return;
    }

    this.assinaturas.push(
      this.signalR.atividadeGerada$.subscribe(() => this.carregarAtividades()),
      this.signalR.atividadeErro$.subscribe(() => this.carregarAtividades())
    );
  }

  carregar(): void {
    this.carregando.set(true);

    this.turmaService.obter(this.turmaId).subscribe({
      next: t => this.turma.set(t),
      error: () => this.mensagemErro.set('Turma não encontrada.')
    });

    this.turmaService.listarAlunos(this.turmaId).subscribe({
      next: a => {
        this.alunos.set(a);
        this.carregando.set(false);
      },
      error: () => {
        this.mensagemErro.set('Não foi possível carregar os alunos.');
        this.carregando.set(false);
      }
    });

    this.carregarAtividades();
  }

  carregarAtividades(): void {
    this.atividadeService.listarPorTurma(this.turmaId).subscribe({
      next: a => this.atividades.set(a),
      error: () => { /* a lista de atividades é secundária nesta tela */ }
    });
  }

  cadastrarAluno(): void {
    if (!this.novoAluno.nome.trim() || !this.novoAluno.matricula.trim()) {
      this.mensagemErro.set('Nome e matrícula são obrigatórios.');
      return;
    }

    this.salvando.set(true);
    this.mensagemErro.set('');

    this.turmaService.cadastrarAluno(
      this.turmaId,
      this.novoAluno.nome.trim(),
      this.novoAluno.matricula.trim(),
      this.novoAluno.tipoNecessidadeAee || undefined,
      this.novoAluno.observacoesAee || undefined
    ).subscribe({
      next: aluno => {
        this.alunos.update(lista => [...lista, aluno]);
        this.novoAluno = { nome: '', matricula: '', tipoNecessidadeAee: '', observacoesAee: '' };
        this.mostrarFormulario.set(false);
        this.salvando.set(false);
      },
      error: erro => {
        this.mensagemErro.set(
          erro.status === 400
            ? 'Já existe um aluno com essa matrícula nesta turma.'
            : 'Não foi possível cadastrar o aluno.');
        this.salvando.set(false);
      }
    });
  }

  corDoStatus(status: string): string {
    switch (status) {
      case 'Pronta': return 'bg-green-100 text-green-700 border-green-300';
      case 'Erro': return 'bg-red-100 text-red-700 border-red-300';
      case 'Processando': return 'bg-amber-100 text-amber-700 border-amber-300';
      default: return 'bg-gray-100 text-gray-600 border-gray-300';
    }
  }
}
