import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OperadoresService {

  constructor(private http: HttpClient) { }

  obtenerOperadores(): Observable<any> {
    return this.http.get<any>(`${environment.API_SECURITY}/operadores`);
  }

  agregarOperador(data: FormData) {
    return this.http.post(environment.API_SECURITY + '/operadores', data);
  }

  eliminarOperador(idOperador: Number) {
		return this.http.delete(environment.API_SECURITY + '/operadores/' + idOperador);
	}

  obtenerOperador(idOperador: number): Observable<any> {
		return this.http.get<any>(environment.API_SECURITY + '/operadores/' + idOperador);
	}

  actualizaridOperador(idOperador: number, saveForm: any): Observable<any> {
    return this.http.put(`${environment.API_SECURITY}/operadores/` + idOperador, saveForm);
  }
  
  
}
