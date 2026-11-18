import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PermissaoProfessorTurma } from '../../../core/models';
import { TurmaService } from '../../../core/lingol-api.service';

@Component({
  selector: 'app-permissoes-turma',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './permissoes-turma.component.html'
})
export class PermissoesTurmaComponent {
  private readonly rota = inject(ActivatedRoute);
  private readonly turmaService = inject(TurmaService);

  readonly turmaId = this.rota.snapshot.paramMap.get('turmaId')!;
  readonly permissoes = signal<PermissaoProfessorTurma[]>([]);
  readonly carregando = signal(true);
  readonly salvando = signal(false);
  readonly removendo = signal<string | null>(null);
  readonly mensagemErro = signal('');
  readonly mensagemSucesso = signal('');

  formulario = {
    email: '',
    podeVisualizar: true,
    podeEditar: false,
    podeAdicionar: false,
    podeExcluir: false
  };

  constructor() {
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.turmaService.listarPermissoes(this.turmaId).subscribe({
      next: permissoes => {
        this.permissoes.set(permissoes);
        this.carregando.set(false);
      },
      error: erro => {
        this.mensagemErro.set(erro.error?.erro ?? 'Não foi possível carregar as permissões desta turma.');
        this.carregando.set(false);
      }
    });
  }

  editar(permissao: PermissaoProfessorTurma): void {
    this.formulario = {
      email: permissao.email,
      podeVisualizar: permissao.podeVisualizar,
      podeEditar: permissao.podeEditar,
      podeAdicionar: permissao.podeAdicionar,
      podeExcluir: permissao.podeExcluir
    };
    this.mensagemErro.set('');
    this.mensagemSucesso.set('');
  }

  salvar(): void {
    if (!this.formulario.email.trim()) {
      this.mensagemErro.set('Informe o e-mail do professor.');
      return;
    }

    this.salvando.set(true);
    this.mensagemErro.set('');
    this.mensagemSucesso.set('');

    this.turmaService.salvarPermissao(this.turmaId, {
      ...this.formulario,
      email: this.formulario.email.trim()
    }).subscribe({
      next: permissao => {
        this.permissoes.update(lista => [
          ...lista.filter(item => item.professorId !== permissao.professorId),
          permissao
        ].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')));
        this.mensagemSucesso.set('Permissões salvas.');
        this.salvando.set(false);
      },
      error: erro => {
        this.mensagemErro.set(erro.error?.erro ?? 'Não foi possível salvar as permissões.');
        this.salvando.set(false);
      }
    });
  }

  revogar(permissao: PermissaoProfessorTurma): void {
    if (!window.confirm(`Revogar o acesso de ${permissao.nome} a esta turma?`)) return;

    this.removendo.set(permissao.professorId);
    this.mensagemErro.set('');
    this.turmaService.revogarPermissao(this.turmaId, permissao.professorId).subscribe({
      next: () => {
        this.permissoes.update(lista => lista.filter(item => item.professorId !== permissao.professorId));
        this.removendo.set(null);
      },
      error: erro => {
        this.mensagemErro.set(erro.error?.erro ?? 'Não foi possível revogar o acesso.');
        this.removendo.set(null);
      }
    });
  }
}
