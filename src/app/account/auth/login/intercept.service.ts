// Angular
import { Injectable, Injector } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpResponse } from '@angular/common/http';
// RxJS
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthenticationService } from '../../../core/services/auth.service';
//import { debug } from 'util';

/**
 * More information there => https://medium.com/@MetonymyQT/angular-http-interceptors-what-are-they-and-how-to-use-them-52e060321088
 */
@Injectable()
export class InterceptService implements HttpInterceptor {
	constructor(public auth: AuthenticationService, private injector: Injector) {}
	// intercept request and add token
	intercept(
		request: HttpRequest<any>,
		next: HttpHandler
	): Observable<HttpEvent<any>> {
		const auth = this.injector.get(AuthenticationService);
		const token = auth.getToken();
		if (token) {
			request = request.clone({
				setHeaders: {
					Authorization: `Bearer ${token}`
				}
			});
		}
		if (request.body instanceof FormData) {
			//console.log('Ignoring FormData to avoid setHeaders');
		} else {
			if (!request.headers.has('Content-Type')) {
				request = request.clone({
					setHeaders: {
						'Content-Type': `application/json`
					}
				});
			}
		}
		return next.handle(request);

	}
}
