import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TransaccionesService {

  constructor(private http: HttpClient) { }

  obtenerTransaccionesData(page: number, pageSize: number): Observable<any> {
		return this.http.get(`${environment.API_SECURITY}/transacciones/${page}/${pageSize}`);
	}

  obtenerTransaccion(): Observable<any> {
		return this.http.get(`${environment.API_SECURITY}/transacciones/list`);
	}
  
  agregarTransaccion(data: any) {
    return this.http.post(environment.API_SECURITY + '/transacciones', data);
  }

  
}