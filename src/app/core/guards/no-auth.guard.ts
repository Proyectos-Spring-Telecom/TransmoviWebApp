import { Injectable, inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthenticationService } from '../services/auth.service';

@Injectable({
    providedIn: 'root'
  })
  export class NoAuthGuard {
  
    constructor(private router: Router, private auth: AuthenticationService) {}
  
    canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        //your logic goes here
        if (this.auth.isAuthenticated()) {
          this.router.navigate(['dashboard']);
          return false;
        }
        return true;
    }
  }
  
  export const AuthGuard: CanActivateFn = (next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean => {
    return inject(NoAuthGuard).canActivate(next, state);
  }