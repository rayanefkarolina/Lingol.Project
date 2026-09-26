import { Component, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { AtividadeService, TurmaService } from '../../../core/lingol-api.service';
import { SignalRService } from '../../../core/signalr.service';
import { Aluno, ModoGamificacao, Turma } from '../../../core/models';
import { TEMAS } from '../../aluno/jogo/temas';
import { FundoLingolComponent } from '../../../shared/fundo-lingol.component';

@Component({
  selector: 'app-nova-atividade',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, FundoLingolComponent],
  templateUrl: './nova-atividade.component.html'
})
export class NovaAtividadeComponent implements OnDestroy {
  private rota = inject(ActivatedRoute);
  private router = inject(Router);
  private turmaService = inject(TurmaService);
  private atividadeService = inject(AtividadeService);
  private signalR = inject(SignalRService);

  private assinaturas: Subscription[] = [];

  turmaId = this.rota.snapshot.paramMap.get('turmaId')!;

  turma = signal<Turma | null>(null);
  alunos = signal<Aluno[]>([]);

  form = {
    livro: '',
    assunto: '',
    numQuestoes: 10,
    modo: 'Simples' as ModoGamificacao,
    tema: 'Fantasia'
  };

  /** O tabuleiro gamificado tem 10 slots de itens — esse é o teto do modo. */
  readonly maxQuestoesGamificada = 10;

  readonly temas = Object.values(TEMAS).map(t => ({
    id: t.id,
    titulo: t.titulo,
    icone: t.iconeTitulo,
    abertura: t.tituloAbertura
  }));

  enviando = signal(false);
  mensagemErro = signal('');

  /** Preenchido assim que o 202 chega: a partir daí a tela só espera o SignalR. */
  atividadeId = signal<string | null>(null);
  statusGeracao = signal<'aguardando' | 'pronta' | 'erro'>('aguardando');
  erroGeracao = signal('');
  questoesGeradas = signal(0);

  constructor() {
    this.turmaService.obter(this.turmaId).subscribe({
      next: t => this.turma.set(t),
      error: () => this.mensagemErro.set('Turma não encontrada.')
    });

    this.turmaService.listarAlunos(this.turmaId).subscribe({
      next: a => this.alunos.set(a)
    });
  }

  ngOnDestroy(): void {
    this.assinaturas.forEach(a => a.unsubscribe());
  }

  /** Resumo dos laudos da turma, empacotado no prompt enviado à IA. */
  get contextoAee(): string {
    const comAee = this.alunos().filter(a => a.tipoNecessidade);
    if (comAee.length === 0) return '';

    const contagem = new Map<string, number>();
    for (const aluno of comAee) {
      const tipo = aluno.tipoNecessidade!;
      contagem.set(tipo, (contagem.get(tipo) ?? 0) + 1);
    }

    return [...contagem.entries()]
      .map(([tipo, total]) => `${total} aluno(s) com ${tipo}`)
      .join(', ');
  }

  /** Trocar para gamificado limita as questões ao tamanho do tabuleiro. */
  escolherModo(modo: ModoGamificacao): void {
    this.form.modo = modo;

    if (modo === 'Rpg' && this.form.numQuestoes > this.maxQuestoesGamificada) {
      this.form.numQuestoes = this.maxQuestoesGamificada;
    }
  }

  async gerar(): Promise<void> {
    if (!this.form.livro.trim() || !this.form.assunto.trim()) {
      this.mensagemErro.set('Informe o livro de referência e o assunto.');
      return;
    }

    if (this.form.modo === 'Rpg' && this.form.numQuestoes > this.maxQuestoesGamificada) {
      this.mensagemErro.set(
        `A atividade gamificada aceita no máximo ${this.maxQuestoesGamificada} questões.`);
      return;
    }

    this.enviando.set(true);
    this.mensagemErro.set('');

    // Entra no grupo antes de disparar, para não perder a notificação.
    try {
      await this.signalR.entrarNaTurma(this.turmaId);
      this.escutarConclusao();
    } catch {
      // Sem SignalR caímos no polling do botão "atualizar" da tela de status.
    }

    this.atividadeService.gerar({
      turmaId: this.turmaId,
      livro: this.form.livro.trim(),
      assunto: this.form.assunto.trim(),
      materia: this.turma()?.materia,
      numQuestoes: this.form.numQuestoes || 10,
      modo: this.form.modo,
      tema: this.form.modo === 'Rpg' ? this.form.tema : undefined,
      perfilAeeContexto: this.contextoAee || undefined
    }).subscribe({
      next: resposta => {
        this.atividadeId.set(resposta.atividadeId);
        this.enviando.set(false);
      },
      error: () => {
        this.mensagemErro.set('Não foi possível enfileirar a atividade.');
        this.enviando.set(false);
      }
    });
  }

  private escutarConclusao(): void {
    this.assinaturas.push(
      this.signalR.atividadeGerada$.subscribe(evento => {
        if (evento.atividadeId !== this.atividadeId()) return;
        this.questoesGeradas.set(evento.numQuestoes);
        this.statusGeracao.set('pronta');
      }),
      this.signalR.atividadeErro$.subscribe(evento => {
        if (evento.atividadeId !== this.atividadeId()) return;
        this.erroGeracao.set(evento.erro);
        this.statusGeracao.set('erro');
      })
    );
  }

  abrirAtividade(): void {
    this.router.navigate(['/professor/atividades', this.atividadeId()]);
  }

  tentarNovamente(): void {
    this.atividadeId.set(null);
    this.statusGeracao.set('aguardando');
    this.erroGeracao.set('');
  }
}
