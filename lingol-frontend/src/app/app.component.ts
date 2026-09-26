import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterModule, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { AuthService } from './core/auth.service';
import { FundoLingolComponent } from './shared/fundo-lingol.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule, FundoLingolComponent],
  templateUrl: './app.component.html'
})
export class AppComponent {
  private router = inject(Router);

  auth = inject(AuthService);
  title = 'Lingol';

  private rotaAtual = toSignal(
    this.router.events.pipe(
      filter(evento => evento instanceof NavigationEnd),
      map(() => this.router.url)
    ),
    { initialValue: this.router.url }
  );

  /**
   * O fundo institucional vive aqui, no esqueleto, e não dentro de cada tela.
   *
   * Duas razões. Primeira: as telas entram com `animate-fade-in`, que aplica um
   * `transform` — e um elemento com transform vira o bloco de contenção dos
   * filhos `position: fixed`. Dentro da tela, o fundo ficava preso à seção
   * durante a animação e "saltava" para a janela inteira quando ela terminava.
   * Segunda: assim a imagem é criada uma vez só, em vez de ser destruída e
   * recriada a cada navegação.
   *
   * A vitrine e as telas do aluno logado têm visual próprio e ficam de fora.
   */
  mostrarFundo = computed(() => {
    const rota = this.rotaAtual().split('?')[0];
    return rota.startsWith('/professor')
        || rota.startsWith('/login-professor')
        || rota.startsWith('/login-aluno');
  });
}
