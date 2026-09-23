import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth.service';

@Component({
  selector: 'app-login-aluno',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login-aluno.component.html'
})
export class LoginAlunoComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  credenciais = { nome: '', matricula: '' };
  carregando = signal(false);
  mensagemErro = signal('');

  fazerLogin(): void {
    if (!this.credenciais.nome.trim() || !this.credenciais.matricula.trim()) {
      this.mensagemErro.set('Preencha seu nome e o número de matrícula.');
      return;
    }

    this.carregando.set(true);
    this.mensagemErro.set('');

    this.auth.loginAluno(this.credenciais.nome.trim(), this.credenciais.matricula.trim())
      .subscribe({
        next: () => {
          this.carregando.set(false);
          this.router.navigate(['/aluno']);
        },
        error: () => {
          this.carregando.set(false);
          this.mensagemErro.set('Nome ou número de matrícula incorretos.');
        }
      });
  }
}
