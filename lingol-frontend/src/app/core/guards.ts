import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const professorGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.ehProfessor()) return true;

  return router.createUrlTree(['/login-professor']);
};

export const alunoGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.ehAluno()) return true;

  return router.createUrlTree(['/login-aluno']);
};
