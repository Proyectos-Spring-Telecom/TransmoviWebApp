import { Injectable, Injector } from '@angular/core';
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpContextToken
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthenticationService } from '../../../core/services/auth.service';

export const SKIP_APP_AUTH = new HttpContextToken<boolean>(() => false);

@Injectable()
export class InterceptService implements HttpInterceptor {
  constructor(private auth: AuthenticationService, private injector: Injector) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!request.context.get(SKIP_APP_AUTH)) {
      const sessionToken = this.injector.get(AuthenticationService).getToken();
      if (sessionToken && !request.headers.has('Authorization')) {
        request = request.clone({ setHeaders: { Authorization: `Bearer ${sessionToken}` } });
      }
    }

    const isFormData = request.body instanceof FormData;
    if (!isFormData && !request.headers.has('Content-Type')) {
      request = request.clone({ setHeaders: { 'Content-Type': 'application/json' } });
    }

    return next.handle(request);
  }
}
