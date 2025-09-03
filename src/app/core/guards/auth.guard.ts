import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, CanActivate, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthenticationService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router, private auth: AuthenticationService) {}

  canActivate(route: ActivatedRouteSnapshot,
              state: RouterStateSnapshot): Observable<boolean> | boolean {
                
    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/login']);
      return false;
    }
    return true;
  }

}

// import { Injectable } from '@angular/core';
// import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

// import { AuthenticationService } from '../services/auth.service';
// import { AuthfakeauthenticationService } from '../services/authfake.service';

// import { environment } from '../../../environments/environment';

// @Injectable({ providedIn: 'root' })
// export class AuthGuard  {
//     constructor(
//         private router: Router,
//         private authenticationService: AuthenticationService,
//         private authFackservice: AuthfakeauthenticationService
//     ) { }

//     canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
//         if (environment.defaultauth === 'firebase') {
//             const currentUser = this.authenticationService.currentUser();
//             if (currentUser) {
//                 // logged in so return true
//                 return true;
//             }
//         } else {
//             const currentUser = this.authFackservice.currentUserValue;
//             if (currentUser) {
//                 // logged in so return true
//                 return true;
//             }
//         }
//         // not logged in so redirect to login page with the return url
//         this.router.navigate(['/account/login'], { queryParams: { returnUrl: state.url } });
//         return false;
//     }
// }
