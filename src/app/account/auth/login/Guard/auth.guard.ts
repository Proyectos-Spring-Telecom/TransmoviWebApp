import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, CanActivate, Router } from '@angular/router';
import { Observable } from 'rxjs';
// import { AuthenticationService } from 'src/app/core/services/auth.service';
import { AuthenticationService } from '../../../../core/services/auth.service';
// import { AuthServiceService } from '../services/auth-service.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router, private auth: AuthenticationService) { }

  canActivate(route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | boolean {

    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/login']);
      return false;
    }

    const permisos: string[] = JSON.parse(sessionStorage.getItem('permissions') || '[]');

    const permisoRequerido = route.data['permiso'] as string;

    if (!permisos.includes(permisoRequerido)) {
      this.router.navigate(['/unauthorized']);
      return false;
    }

    return true;
  }
}