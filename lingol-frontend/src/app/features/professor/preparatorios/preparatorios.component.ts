import { Component, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subscription, interval, startWith, switchMap } from 'rxjs';
import { AtividadeService, TurmaService } from '../../../core/lingol-api.service';
import { SignalRService } from '../../../core/signalr.service';
import { StatusAtividade, Turma } from '../../../core/models';

const TAMANHO_MAXIMO_PDF = 10 * 1024 * 1024;
const MAX_QUESTOES = 10;

@Component({
  selector: 'app-preparatorios',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './preparatorios.component.html'
})
export class PreparatoriosComponent implements OnDestroy {
  private readonly turmaService = inject(TurmaService);
  private readonly atividadeService = inject(AtividadeService);
  private readonly signalR = inject(SignalRService);
  private readonly router = inject(Router);

  private assinaturas: Subscription[] = [];
  private consultaStatus?: Subscription;

  turmas = signal<Turma[]>([]);
  carregandoTurmas = signal(true);
  turmaId = '';
  prova = 'Provão Paulista';
  outraProva = '';
  materia = 'Português';
  outraMateria = '';
  numQuestoes = MAX_QUESTOES;
  arquivo: File | null = null;
  enviando = signal(false);
  atividadeId = signal<string | null>(null);
  statusGeracao = signal<StatusAtividade>('Pendente');
  mensagemErro = signal('');
  mensagemAviso = signal('');
  questoesGeradas = signal(0);

  readonly tamanhoMaximoPdf = TAMANHO_MAXIMO_PDF;
  readonly maxQuestoes = MAX_QUESTOES;
  readonly provas = ['Provão Paulista', 'SARESP', 'SAEB', 'Outro'];
  readonly materias = ['Português', 'Matemática', 'Outros'];

  constructor() {
    this.turmaService.listar().subscribe({
      next: turmas => {
        const turmasPermitidas = turmas.filter(turma => turma.podeAdicionar);
        this.turmas.set(turmasPermitidas);
        this.turmaId = turmasPermitidas[0]?.id ?? '';
        if (turmas.length > 0 && turmasPermitidas.length === 0) {
          this.mensagemErro.set('Você não tem permissão para adicionar atividades nas turmas disponíveis.');
        }
        this.carregandoTurmas.set(false);
      },
      error: () => {
        this.mensagemErro.set('Não foi possível carregar suas turmas.');
        this.carregandoTurmas.set(false);
      }
    });
  }

  ngOnDestroy(): void {
    this.assinaturas.forEach(assinatura => assinatura.unsubscribe());
    this.consultaStatus?.unsubscribe();
    const turmaId = this.turmaId;
    if (turmaId) void this.signalR.sairDaTurma(turmaId);
  }

  selecionarArquivo(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const arquivo = input.files?.[0] ?? null;
    this.mensagemErro.set('');

    if (arquivo && !arquivo.name.toLowerCase().endsWith('.pdf')) {
      this.arquivo = null;
      input.value = '';
      this.mensagemErro.set('Envie um arquivo com extensão PDF.');
      return;
    }

    if (arquivo && arquivo.size > TAMANHO_MAXIMO_PDF) {
      this.arquivo = null;
      input.value = '';
      this.mensagemErro.set('O PDF deve ter no máximo 10 MB.');
      return;
    }

    this.arquivo = arquivo;
  }

  async gerar(): Promise<void> {
    if (!this.turmaId) {
      this.mensagemErro.set('Selecione uma turma na qual você tenha permissão para adicionar atividades.');
      return;
    }

    if (!this.arquivo) {
      this.mensagemErro.set('Selecione um arquivo PDF com as questões.');
      return;
    }

    if (!Number.isInteger(this.numQuestoes) || this.numQuestoes < 1 || this.numQuestoes > MAX_QUESTOES) {
      this.mensagemErro.set(`Informe de 1 a ${MAX_QUESTOES} questões para o jogo.`);
      return;
    }

    if (this.prova === 'Outro' && !this.outraProva.trim()) {
      this.mensagemErro.set('Informe o nome da prova.');
      return;
    }

    if (this.materia === 'Outros' && !this.outraMateria.trim()) {
      this.mensagemErro.set('Informe a matéria do preparatório.');
      return;
    }

    this.enviando.set(true);
    this.mensagemErro.set('');
    this.mensagemAviso.set('');
    this.assinarEventos();

    try {
      await this.signalR.entrarNaTurma(this.turmaId);
    } catch {
      this.mensagemAviso.set('A geração será enviada. O status será atualizado automaticamente.');
    }

    const formulario = new FormData();
    formulario.append('turmaId', this.turmaId);
    formulario.append('prova', this.prova);
    formulario.append('outraProva', this.outraProva.trim());
    formulario.append('materia', this.materia);
    formulario.append('outraMateria', this.outraMateria.trim());
    formulario.append('numQuestoes', String(this.numQuestoes));
    formulario.append('arquivo', this.arquivo, this.arquivo.name);

    this.atividadeService.gerarPreparatorio(formulario).subscribe({
      next: resposta => {
        this.atividadeId.set(resposta.atividadeId);
        this.statusGeracao.set(resposta.status);
        this.enviando.set(false);
        this.iniciarConsultaStatus();
      },
      error: erro => {
        this.mensagemErro.set(erro.error?.erro ?? 'Não foi possível enviar o PDF para gerar o preparatório.');
        this.enviando.set(false);
      }
    });
  }

  abrirAtividade(): void {
    const atividadeId = this.atividadeId();
    if (atividadeId) void this.router.navigate(['/professor/atividades', atividadeId]);
  }

  tentarNovamente(): void {
    this.consultaStatus?.unsubscribe();
    this.atividadeId.set(null);
    this.statusGeracao.set('Pendente');
    this.mensagemErro.set('');
    this.questoesGeradas.set(0);
  }

  private assinarEventos(): void {
    this.assinaturas.forEach(assinatura => assinatura.unsubscribe());
    this.assinaturas = [
      this.signalR.atividadeGerada$.subscribe(evento => {
        if (evento.atividadeId !== this.atividadeId()) return;
        this.questoesGeradas.set(evento.numQuestoes);
        this.statusGeracao.set('Pronta');
        this.consultaStatus?.unsubscribe();
      }),
      this.signalR.atividadeErro$.subscribe(evento => {
        if (evento.atividadeId !== this.atividadeId()) return;
        this.mensagemErro.set(evento.erro);
        this.statusGeracao.set('Erro');
        this.consultaStatus?.unsubscribe();
      })
    ];
  }

  private iniciarConsultaStatus(): void {
    this.consultaStatus?.unsubscribe();
    this.consultaStatus = interval(3000).pipe(
      startWith(0),
      switchMap(() => this.atividadeService.obter(this.atividadeId()!))
    ).subscribe({
      next: atividade => {
        this.statusGeracao.set(atividade.status);
        if (atividade.status === 'Pronta') {
          this.questoesGeradas.set(atividade.numQuestoes);
          this.consultaStatus?.unsubscribe();
        } else if (atividade.status === 'Erro') {
          this.mensagemErro.set(atividade.mensagemErro ?? 'A IA não conseguiu gerar este preparatório.');
          this.consultaStatus?.unsubscribe();
        }
      },
      error: () => this.mensagemAviso.set('Não foi possível atualizar o status. Tente novamente em instantes.')
    });
  }
}
