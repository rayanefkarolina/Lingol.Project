import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login-aluno',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login-aluno.component.html'
})
export class LoginAlunoComponent {
  private http = inject(HttpClient);
  private router = inject(Router);

  credenciais = { Nome: '', Matricula: '' };
  carregando = false;
  mensagemErro = '';

  fazerLogin() {
    this.carregando = true;
    this.mensagemErro = '';

    // Chamada REAL para a Cadastro.API no endpoint do Aluno
    this.http.post('http://localhost:5030/api/auth/aluno/login', this.credenciais)
      .subscribe({
        next: (response: any) => {
          this.carregando = false;
          localStorage.setItem('lingol_token', response.accessToken);
          this.router.navigate(['/atividade']);
        },
        error: (err) => {
          this.carregando = false;
          this.mensagemErro = 'Nome ou número de matrícula incorretos.';
          console.error(err);
        }
      });
  }
}
