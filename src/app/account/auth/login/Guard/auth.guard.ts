import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthenticationService } from '../../../../core/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router, private auth: AuthenticationService) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    if (!this.auth.isAuthenticated()) {
      return this.router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
    }

    const permisoRequerido = route.data['permiso'] as string | undefined;

    if (!permisoRequerido) {
      return true;
    }

    const permisos: string[] = JSON.parse(sessionStorage.getItem('permissions') || '[]');

    if (!permisos.includes(permisoRequerido)) {
      return this.router.createUrlTree(['/unauthorized']);
    }

    return true;
  }
}