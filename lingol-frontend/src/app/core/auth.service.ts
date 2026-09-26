import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginAlunoResponse, LoginProfessorResponse, Papel } from './models';

const CHAVE_TOKEN = 'lingol_token';

/** Claims emitidas pelo Cadastro.API. */
interface LingolClaims {
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier': string;
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name': string;
  role: string | string[];
  turmaId?: string;
  matricula?: string;
  perfilAee?: string;
  exp: number;
}

export interface UsuarioLogado {
  id: string;
  nome: string;
  papel: Papel;
  turmaId?: string;
  matricula?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly _usuario = signal<UsuarioLogado | null>(this.lerTokenSalvo());

  readonly usuario = this._usuario.asReadonly();
  readonly autenticado = computed(() => this._usuario() !== null);
  readonly ehProfessor = computed(() => this._usuario()?.papel === 'Professor');
  readonly ehAluno = computed(() => this._usuario()?.papel === 'Aluno');

  get token(): string | null {
    return localStorage.getItem(CHAVE_TOKEN);
  }

  loginProfessor(email: string, senha: string): Observable<LoginProfessorResponse> {
    return this.http
      .post<LoginProfessorResponse>(`${environment.cadastroApi}/api/auth/professor/login`, { email, senha })
      .pipe(tap(r => this.salvarToken(r.accessToken)));
  }

  registrarProfessor(nome: string, email: string, senha: string): Observable<unknown> {
    return this.http.post(`${environment.cadastroApi}/api/auth/professor/register`, { nome, email, senha });
  }

  /** Sem fricção: o aluno entra apenas com o número de matrícula. */
  loginAluno(matricula: string): Observable<LoginAlunoResponse> {
    return this.http
      .post<LoginAlunoResponse>(`${environment.cadastroApi}/api/auth/aluno/login`, { matricula })
      .pipe(tap(r => this.salvarToken(r.accessToken)));
  }

  sair(): void {
    localStorage.removeItem(CHAVE_TOKEN);
    this._usuario.set(null);
    this.router.navigate(['/']);
  }

  private salvarToken(token: string): void {
    localStorage.setItem(CHAVE_TOKEN, token);
    this._usuario.set(this.decodificar(token));
  }

  private lerTokenSalvo(): UsuarioLogado | null {
    const token = localStorage.getItem(CHAVE_TOKEN);
    if (!token) return null;

    const usuario = this.decodificar(token);
    if (!usuario) localStorage.removeItem(CHAVE_TOKEN);
    return usuario;
  }

  private decodificar(token: string): UsuarioLogado | null {
    try {
      const claims = jwtDecode<LingolClaims>(token);

      // Token expirado não serve para nada: melhor derrubar aqui.
      if (claims.exp * 1000 <= Date.now()) return null;

      const role = Array.isArray(claims.role) ? claims.role[0] : claims.role;

      return {
        id: claims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'],
        nome: claims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'],
        papel: role as Papel,
        turmaId: claims.turmaId,
        matricula: claims.matricula
      };
    } catch {
      return null;
    }
  }
}
