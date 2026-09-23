import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AtividadeService } from '../../../core/lingol-api.service';
import { AuthService } from '../../../core/auth.service';
import { Atividade, Questao } from '../../../core/models';
import { EstagioAvatar, TemaJogo, obterTema } from './temas';

type Etapa = 'carregando' | 'intro' | 'questao' | 'arsenal' | 'fim' | 'erro';

interface Feedback {
  acertou: boolean;
  explicacao: string | null;
  item: { nome: string; icone: string } | null;
}

@Component({
  selector: 'app-jogo',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './jogo.component.html',
  styleUrl: './jogo.component.css'
})
export class JogoComponent {
  private rota = inject(ActivatedRoute);
  private atividadeService = inject(AtividadeService);
  auth = inject(AuthService);

  atividadeId = this.rota.snapshot.paramMap.get('atividadeId')!;

  tema = signal<TemaJogo>(obterTema(null));
  atividade = signal<Atividade | null>(null);
  questoes = signal<Questao[]>([]);

  etapa = signal<Etapa>('carregando');
  mensagemErro = signal('');

  indiceAtual = signal(0);
  acertos = signal(0);
  respondendo = signal(false);

  /** Índice da alternativa escolhida e a correta, para pintar os botões. */
  escolhida = signal<number | null>(null);
  correta = signal<number | null>(null);

  feedback = signal<Feedback | null>(null);
  resultadoFinal = signal<{ acertos: number; total: number; mensagem: string } | null>(null);

  private iniciadoEm = Date.now();

  readonly totalFases = computed(() => this.questoes().length);
  readonly questaoAtual = computed(() => this.questoes()[this.indiceAtual()] ?? null);
  readonly ehUltimaFase = computed(() => this.indiceAtual() >= this.totalFases() - 1);

  /** Um slot de item por questão — o tabuleiro encolhe junto com a atividade. */
  readonly slots = computed(() =>
    this.tema().itens.slice(0, this.totalFases()).map((item, i) => ({
      ...item,
      desbloqueado: i < this.acertos()
    }))
  );

  readonly avatar = computed<EstagioAvatar>(() => {
    const t = this.tema();
    return t.estagiosAvatar.find(e => this.acertos() >= e.minimo) ?? t.avatarPadrao;
  });

  constructor() {
    this.carregar();
  }

  private carregar(): void {
    this.atividadeService.obter(this.atividadeId).subscribe({
      next: atividade => {
        this.atividade.set(atividade);
        this.tema.set(obterTema(atividade.tema));

        if (atividade.status !== 'Pronta') {
          this.mensagemErro.set('Esta atividade ainda não está disponível.');
          this.etapa.set('erro');
          return;
        }

        this.atividadeService.obterQuestoes(this.atividadeId).subscribe({
          next: questoes => {
            this.questoes.set(questoes);
            this.etapa.set(questoes.length ? 'intro' : 'erro');
            if (!questoes.length) this.mensagemErro.set('Esta atividade não tem questões.');
          },
          error: () => this.falhar('Não foi possível carregar as questões.')
        });
      },
      error: () => this.falhar('Atividade não encontrada.')
    });
  }

  private falhar(mensagem: string): void {
    this.mensagemErro.set(mensagem);
    this.etapa.set('erro');
  }

  iniciar(): void {
    this.iniciadoEm = Date.now();
    this.etapa.set('questao');
  }

  /** A letra é o que o backend usa como gabarito; o texto vem do tema/IA. */
  letra(indice: number): string {
    return ['A', 'B', 'C', 'D'][indice] ?? '?';
  }

  responder(indice: number): void {
    if (this.respondendo() || this.escolhida() !== null) return;

    const questao = this.questaoAtual();
    if (!questao) return;

    this.respondendo.set(true);
    this.escolhida.set(indice);

    const tempo = Math.max(1, Math.round((Date.now() - this.iniciadoEm) / 1000));

    this.atividadeService
      .responderQuestao(this.atividadeId, questao.id, this.letra(indice), tempo)
      .subscribe({
        next: resposta => {
          this.respondendo.set(false);
          this.acertos.set(resposta.acertos);

          const indiceCorreto = ['A', 'B', 'C', 'D']
            .indexOf(resposta.gabaritoOuCriterio.trim().toUpperCase());
          this.correta.set(indiceCorreto >= 0 ? indiceCorreto : null);

          // O item conquistado é o da posição do acerto, não o da fase.
          const item = resposta.estaCorreta
            ? this.tema().itens[resposta.acertos - 1] ?? null
            : null;

          setTimeout(() => {
            this.feedback.set({
              acertou: resposta.estaCorreta,
              explicacao: resposta.explicacao,
              item
            });
          }, resposta.estaCorreta ? 700 : 1200);
        },
        error: erro => {
          this.respondendo.set(false);
          this.escolhida.set(null);
          this.falhar(erro.error?.erro ?? 'Não foi possível registrar sua resposta.');
        }
      });
  }

  fecharFeedback(): void {
    this.feedback.set(null);
    this.escolhida.set(null);
    this.correta.set(null);

    if (this.ehUltimaFase()) {
      this.finalizar();
    } else {
      this.etapa.set('arsenal');
    }
  }

  proximaFase(): void {
    this.indiceAtual.update(i => i + 1);
    this.iniciadoEm = Date.now();
    this.etapa.set('questao');
  }

  private finalizar(): void {
    this.atividadeService.finalizar(this.atividadeId).subscribe({
      next: resultado => {
        this.resultadoFinal.set({
          acertos: resultado.acertos,
          total: resultado.totalQuestoes,
          mensagem: resultado.mensagem
        });
        this.etapa.set('fim');
      },
      error: () => this.falhar('Não foi possível fechar sua atividade.')
    });
  }
}
