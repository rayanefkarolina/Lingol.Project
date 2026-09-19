import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login-prof',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login-prof.component.html'
})
export class LoginProfComponent {
  private http = inject(HttpClient);
  private router = inject(Router);

  // Aqui ficam as variáveis reais do Angular
  credenciais = { email: '', senha: '' };
  carregando = false;
  mensagemErro = '';

  fazerLogin() {
    this.carregando = true;
    this.mensagemErro = '';

    // Chamada REAL para o backend .NET
    this.http.post('http://localhost:5030/api/auth/professor/login', this.credenciais)
      .subscribe({
        next: (response: any) => {
          this.carregando = false;
          // Salva o Token JWT emitido pelo C#
          localStorage.setItem('lingol_token', response.accessToken);
          // Redireciona para o painel
          this.router.navigate(['/dashboard-professor']);
        },
        error: (err) => {
          this.carregando = false;
          if (err.status === 401) {
            this.mensagemErro = 'E-mail ou senha incorretos.';
          } else {
            this.mensagemErro = 'Erro ao conectar com o servidor.';
          }
          console.error(err);
        }
      });
  }
}