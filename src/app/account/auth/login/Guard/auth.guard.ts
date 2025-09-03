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

    // Verificar si el usuario está autenticado
    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/login']);
      return false;
    }

    // Obtener los permisos del usuario desde el local storage
    const permisos: string[] = JSON.parse(sessionStorage.getItem('permissions') || '[]');
    // console.log(permisos);
    
    // Verificar si la ruta actual requiere un permiso específico
    const permisoRequerido = route.data['permiso'] as string; // Permiso requerido configurado en la ruta

    if (!permisos.includes(permisoRequerido)) {
      // Redirigir al usuario si no tiene el permiso necesario
      this.router.navigate(['/unauthorized']); // Ruta a una página de "no autorizado"
      return false;
    }

    return true;
  }
}