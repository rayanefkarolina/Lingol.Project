import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth.service';

@Component({
  selector: 'app-login-prof',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login-prof.component.html'
})
export class LoginProfComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  modoCadastro = signal(false);
  carregando = signal(false);
  mensagemErro = signal('');
  mensagemSucesso = signal('');

  credenciais = { nome: '', email: '', senha: '' };

  alternarModo(): void {
    this.modoCadastro.set(!this.modoCadastro());
    this.mensagemErro.set('');
    this.mensagemSucesso.set('');
  }

  fazerLogin(): void {
    this.carregando.set(true);
    this.mensagemErro.set('');

    this.auth.loginProfessor(this.credenciais.email, this.credenciais.senha).subscribe({
      next: () => {
        this.carregando.set(false);
        this.router.navigate(['/professor']);
      },
      error: erro => {
        this.carregando.set(false);
        this.mensagemErro.set(
          erro.status === 401
            ? 'E-mail ou senha incorretos.'
            : 'Erro ao conectar com o servidor.');
      }
    });
  }

  registrar(): void {
    if (this.credenciais.senha.length < 8) {
      this.mensagemErro.set('A senha precisa ter no mínimo 8 caracteres.');
      return;
    }

    this.carregando.set(true);
    this.mensagemErro.set('');

    this.auth.registrarProfessor(
      this.credenciais.nome,
      this.credenciais.email,
      this.credenciais.senha
    ).subscribe({
      next: () => {
        // Já entra direto: evita pedir a senha duas vezes.
        this.auth.loginProfessor(this.credenciais.email, this.credenciais.senha).subscribe({
          next: () => {
            this.carregando.set(false);
            this.router.navigate(['/professor']);
          },
          error: () => {
            this.carregando.set(false);
            this.modoCadastro.set(false);
            this.mensagemSucesso.set('Conta criada! Faça login para continuar.');
          }
        });
      },
      error: erro => {
        this.carregando.set(false);
        this.mensagemErro.set(
          erro.error?.mensagem ?? 'Não foi possível criar a conta.');
      }
    });
  }
}
