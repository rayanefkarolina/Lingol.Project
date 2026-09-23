import { Injectable, inject } from '@angular/core';
import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { AtividadeErroEvento, AtividadeGeradaEvento, CorrecaoProntaEvento } from './models';
import { AuthService } from './auth.service';

/**
 * Canal em tempo real com o microsserviço pedagógico. O professor entra no grupo
 * da turma e é avisado quando a IA termina de gerar a atividade ou de diagnosticar
 * uma entrega — sem precisar ficar recarregando a tela.
 */
@Injectable({ providedIn: 'root' })
export class SignalRService {
  private auth = inject(AuthService);
  private conexao?: HubConnection;
  private turmasInscritas = new Set<string>();

  readonly atividadeGerada$ = new Subject<AtividadeGeradaEvento>();
  readonly atividadeErro$ = new Subject<AtividadeErroEvento>();
  readonly correcaoPronta$ = new Subject<CorrecaoProntaEvento>();

  async entrarNaTurma(turmaId: string): Promise<void> {
    await this.garantirConexao();

    if (this.turmasInscritas.has(turmaId)) return;

    await this.conexao!.invoke('JoinTurmaGroup', turmaId);
    this.turmasInscritas.add(turmaId);
  }

  async sairDaTurma(turmaId: string): Promise<void> {
    if (this.conexao?.state !== HubConnectionState.Connected) return;
    if (!this.turmasInscritas.has(turmaId)) return;

    await this.conexao.invoke('LeaveTurmaGroup', turmaId);
    this.turmasInscritas.delete(turmaId);
  }

  private async garantirConexao(): Promise<void> {
    if (this.conexao?.state === HubConnectionState.Connected) return;

    if (!this.conexao) {
      this.conexao = new HubConnectionBuilder()
        .withUrl(`${environment.pedagogicoApi}/hubs/atividades`, {
          // O hub valida o mesmo JWT; o backend lê o token da query string.
          accessTokenFactory: () => this.auth.token ?? ''
        })
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Warning)
        .build();

      this.conexao.on('AtividadeGerada', (e: AtividadeGeradaEvento) => this.atividadeGerada$.next(e));
      this.conexao.on('AtividadeErro', (e: AtividadeErroEvento) => this.atividadeErro$.next(e));
      this.conexao.on('CorrecaoPronta', (e: CorrecaoProntaEvento) => this.correcaoPronta$.next(e));

      // Reconectou: precisa reentrar nos grupos, que vivem na conexão.
      this.conexao.onreconnected(async () => {
        const turmas = [...this.turmasInscritas];
        this.turmasInscritas.clear();
        for (const turmaId of turmas) {
          await this.entrarNaTurma(turmaId);
        }
      });
    }

    if (this.conexao.state === HubConnectionState.Disconnected) {
      await this.conexao.start();
    }
  }
}
