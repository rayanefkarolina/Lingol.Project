import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth.service';
import { FundoLingolComponent } from '../../../shared/fundo-lingol.component';

@Component({
  selector: 'app-login-aluno',
  standalone: true,
  imports: [CommonModule, FormsModule, FundoLingolComponent],
  templateUrl: './login-aluno.component.html'
})
export class LoginAlunoComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  credenciais = { matricula: '' };
  carregando = signal(false);
  mensagemErro = signal('');

  fazerLogin(): void {
    if (!this.credenciais.matricula.trim()) {
      this.mensagemErro.set('Informe o seu número de matrícula.');
      return;
    }

    this.carregando.set(true);
    this.mensagemErro.set('');

    this.auth.loginAluno(this.credenciais.matricula.trim())
      .subscribe({
        next: () => {
          this.carregando.set(false);
          this.router.navigate(['/aluno']);
        },
        error: () => {
          this.carregando.set(false);
          this.mensagemErro.set('Matrícula não encontrada. Confira o número com seu professor.');
        }
      });
  }
}
