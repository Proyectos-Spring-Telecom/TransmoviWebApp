import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AuthenticationService } from '../services/auth.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
    constructor(private authenticationService: AuthenticationService) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(request).pipe(catchError(err => {
            const isLoginRequest = request.url.includes('/login');

            if (err.status === 401 && !isLoginRequest) {
                // Auto logout on protected endpoints, but never reload on login errors.
                this.authenticationService.logout();
            }

            const backendMessage =
                err.error?.message ||
                err.error?.error ||
                err.message ||
                err.statusText ||
                'Error desconocido';

            return throwError(() => ({
                status: err.status,
                message: backendMessage,
                error: err.error,
            }));
        }))
    }
}