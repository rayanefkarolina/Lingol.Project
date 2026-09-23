import { Routes } from '@angular/router';
import { alunoGuard, professorGuard } from './core/guards';
import { LandingComponent } from './features/landing/landing.component';
import { LoginProfComponent } from './features/auth/login-prof/login-prof.component';
import { LoginAlunoComponent } from './features/auth/login-aluno/login-aluno.component';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'login-professor', component: LoginProfComponent },
  { path: 'login-aluno', component: LoginAlunoComponent },

  // Área do professor (carregada sob demanda)
  {
    path: 'professor',
    canActivate: [professorGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/professor/dashboard/dashboard.component')
            .then(m => m.DashboardProfessorComponent)
      },
      {
        path: 'turmas/:turmaId',
        loadComponent: () =>
          import('./features/professor/turma-detalhe/turma-detalhe.component')
            .then(m => m.TurmaDetalheComponent)
      },
      {
        path: 'turmas/:turmaId/nova-atividade',
        loadComponent: () =>
          import('./features/professor/nova-atividade/nova-atividade.component')
            .then(m => m.NovaAtividadeComponent)
      },
      {
        path: 'turmas/:turmaId/relatorio',
        loadComponent: () =>
          import('./features/professor/relatorio-turma/relatorio-turma.component')
            .then(m => m.RelatorioTurmaComponent)
      },
      {
        path: 'atividades/:atividadeId',
        loadComponent: () =>
          import('./features/professor/atividade-detalhe/atividade-detalhe.component')
            .then(m => m.AtividadeDetalheComponent)
      }
    ]
  },

  // Área do aluno
  {
    path: 'aluno',
    canActivate: [alunoGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/aluno/home/home.component').then(m => m.AlunoHomeComponent)
      },
      {
        path: 'atividades/:atividadeId',
        loadComponent: () =>
          import('./features/aluno/atividade-simples/atividade-simples.component')
            .then(m => m.AtividadeSimplesComponent)
      },
      {
        path: 'jogo/:atividadeId',
        loadComponent: () =>
          import('./features/aluno/jogo/jogo.component').then(m => m.JogoComponent)
      }
    ]
  },

  { path: '**', redirectTo: '' }
];
