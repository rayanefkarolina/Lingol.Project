import { Routes } from '@angular/router';
// Adicione a pasta duplicada "landing" no caminho do import:
import { LandingComponent } from './features/landing/landing.component';
import { LoginProfComponent } from './features/auth/login-prof/login-prof.component';
import { LoginAlunoComponent } from './features/auth/login-aluno/login-aluno.component';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'login-professor', component: LoginProfComponent },
  { path: 'login-aluno', component: LoginAlunoComponent },
  { path: '**', redirectTo: '' }
];