import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AtividadeService } from '../../../core/lingol-api.service';
import { AuthService } from '../../../core/auth.service';
import { Atividade, Questao } from '../../../core/models';

type Etapa = 'carregando' | 'respondendo' | 'fim' | 'erro';

interface Correcao {
  acertou: boolean;
  explicacao: string | null;
}

@Component({
  selector: 'app-atividade-simples',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './atividade-simples.component.html'
})
export class AtividadeSimplesComponent {
  private rota = inject(ActivatedRoute);
  private atividadeService = inject(AtividadeService);
  auth = inject(AuthService);

  atividadeId = this.rota.snapshot.paramMap.get('atividadeId')!;

  atividade = signal<Atividade | null>(null);
  questoes = signal<Questao[]>([]);
  etapa = signal<Etapa>('carregando');
  mensagemErro = signal('');

  indiceAtual = signal(0);
  acertos = signal(0);
  enviando = signal(false);

  escolhida = signal<number | null>(null);
  correcao = signal<Correcao | null>(null);

  resultadoFinal = signal<{ acertos: number; total: number; mensagem: string } | null>(null);

  private iniciadoEm = Date.now();

  readonly total = computed(() => this.questoes().length);
  readonly questaoAtual = computed(() => this.questoes()[this.indiceAtual()] ?? null);
  readonly ehUltima = computed(() => this.indiceAtual() >= this.total() - 1);
  readonly progresso = computed(() =>
    this.total() === 0 ? 0 : Math.round((this.indiceAtual() / this.total()) * 100));

  constructor() {
    this.atividadeService.obter(this.atividadeId).subscribe({
      next: atividade => {
        this.atividade.set(atividade);

        if (atividade.status !== 'Pronta') {
          this.falhar('Esta atividade ainda não está disponível.');
          return;
        }

        this.atividadeService.obterQuestoes(this.atividadeId).subscribe({
          next: questoes => {
            this.questoes.set(questoes);
            this.etapa.set(questoes.length ? 'respondendo' : 'erro');
            if (!questoes.length) this.mensagemErro.set('Esta atividade não tem questões.');
            this.iniciadoEm = Date.now();
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

  letra(indice: number): string {
    return ['A', 'B', 'C', 'D'][indice] ?? '?';
  }

  responder(indice: number): void {
    if (this.enviando() || this.escolhida() !== null) return;

    const questao = this.questaoAtual();
    if (!questao) return;

    this.enviando.set(true);
    this.escolhida.set(indice);

    const tempo = Math.max(1, Math.round((Date.now() - this.iniciadoEm) / 1000));

    this.atividadeService
      .responderQuestao(this.atividadeId, questao.id, this.letra(indice), tempo)
      .subscribe({
        next: resposta => {
          this.enviando.set(false);
          this.acertos.set(resposta.acertos);
          this.correcao.set({ acertou: resposta.estaCorreta, explicacao: resposta.explicacao });
        },
        error: erro => {
          this.enviando.set(false);
          this.escolhida.set(null);
          this.falhar(erro.error?.erro ?? 'Não foi possível registrar sua resposta.');
        }
      });
  }

  avancar(): void {
    this.escolhida.set(null);
    this.correcao.set(null);

    if (this.ehUltima()) {
      this.finalizar();
      return;
    }

    this.indiceAtual.update(i => i + 1);
    this.iniciadoEm = Date.now();
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
