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
  excluindoAluno = signal<string | null>(null);
  editandoTurma = signal(false);
  atualizandoVisibilidade = signal<Record<string, boolean>>({});

  /** Mostrado depois do cadastro: é com esse número que o aluno entra. */
  matriculaGerada = signal('');
  dadosTurma = { nome: '', materia: '', ano: 6 };
  novoAluno = { nome: '', tipoNecessidadeAee: '', observacoesAee: '' };

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
      next: t => {
        this.turma.set(t);
        this.dadosTurma = { nome: t.nome, materia: t.materia, ano: t.ano };
      },
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

  atualizarTurma(): void {
    if (!this.turma()?.podeEditar || !this.dadosTurma.nome.trim() || !this.dadosTurma.materia.trim()) {
      this.mensagemErro.set('Informe nome e matéria para atualizar a turma.');
      return;
    }

    this.salvando.set(true);
    this.turmaService.atualizarTurma(this.turmaId, {
      nome: this.dadosTurma.nome.trim(),
      materia: this.dadosTurma.materia.trim(),
      ano: this.dadosTurma.ano
    }).subscribe({
      next: turma => {
        this.turma.set(turma);
        this.editandoTurma.set(false);
        this.salvando.set(false);
      },
      error: erro => {
        this.mensagemErro.set(erro.error?.erro ?? 'Não foi possível editar os dados da turma.');
        this.salvando.set(false);
      }
    });
  }

  excluirAluno(aluno: Aluno): void {
    if (!this.turma()?.podeExcluir || this.excluindoAluno()) return;
    if (!window.confirm(
      `Remover ${aluno.nome} da turma? As respostas anteriores serão mantidas no histórico.`)) return;

    this.excluindoAluno.set(aluno.id);
    this.turmaService.excluirAluno(this.turmaId, aluno.id).subscribe({
      next: () => {
        this.alunos.update(lista => lista.filter(item => item.id !== aluno.id));
        this.excluindoAluno.set(null);
      },
      error: erro => {
        this.mensagemErro.set(erro.error?.erro ?? 'Não foi possível excluir o aluno.');
        this.excluindoAluno.set(null);
      }
    });
  }

  carregarAtividades(): void {
    this.atividadeService.listarPorTurma(this.turmaId).subscribe({
      next: a => this.atividades.set(a),
      error: () => { /* a lista de atividades é secundária nesta tela */ }
    });
  }

  definirVisibilidade(atividade: AtividadeResumo, aluno: Aluno): void {
    const ocultos = atividade.alunosOcultos ?? [];
    const visivel = ocultos.includes(aluno.id);
    const chave = `${atividade.id}:${aluno.id}`;
    if (this.atualizandoVisibilidade()[chave]) return;

    this.atualizandoVisibilidade.update(atualizando => ({ ...atualizando, [chave]: true }));
    this.atividadeService.definirVisibilidadeParaAluno(atividade.id, aluno.id, visivel).subscribe({
      next: () => {
        this.atividades.update(lista => lista.map(item => item.id !== atividade.id
          ? item
          : {
              ...item,
              alunosOcultos: visivel
                ? (item.alunosOcultos ?? []).filter(id => id !== aluno.id)
                : [...(item.alunosOcultos ?? []), aluno.id]
            }));
        this.atualizandoVisibilidade.update(atualizando => ({ ...atualizando, [chave]: false }));
      },
      error: erro => {
        this.mensagemErro.set(erro.error?.erro ?? 'Não foi possível atualizar o acesso do aluno.');
        this.atualizandoVisibilidade.update(atualizando => ({ ...atualizando, [chave]: false }));
      }
    });
  }

  cadastrarAluno(): void {
    if (!this.novoAluno.nome.trim()) {
      this.mensagemErro.set('Informe o nome do aluno.');
      return;
    }

    this.salvando.set(true);
    this.mensagemErro.set('');

    this.turmaService.cadastrarAluno(
      this.turmaId,
      this.novoAluno.nome.trim(),
      this.novoAluno.tipoNecessidadeAee || undefined,
      this.novoAluno.observacoesAee || undefined
    ).subscribe({
      next: aluno => {
        this.alunos.update(lista => [...lista, aluno]);
        this.novoAluno = { nome: '', tipoNecessidadeAee: '', observacoesAee: '' };
        this.matriculaGerada.set(aluno.matricula);
        this.mostrarFormulario.set(false);
        this.salvando.set(false);
      },
      error: erro => {
        this.mensagemErro.set(
          erro.error?.erro ?? 'Não foi possível cadastrar o aluno.');
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
