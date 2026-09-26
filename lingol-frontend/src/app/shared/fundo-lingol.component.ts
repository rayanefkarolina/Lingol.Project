import { Component } from '@angular/core';

/**
 * Fundo institucional da plataforma (telas do professor e entrada do aluno).
 * É só enfeite: fica fixo atrás de todo o conteúdo e não recebe clique.
 */
@Component({
  selector: 'app-fundo-lingol',
  standalone: true,
  template: `
    <img src="img/fundo-lingol.jpg" alt="" aria-hidden="true"
         class="pointer-events-none select-none fixed inset-0 -z-10 h-full w-full object-cover">
  `
})
export class FundoLingolComponent {}
