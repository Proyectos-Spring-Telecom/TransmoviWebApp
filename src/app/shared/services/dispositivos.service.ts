import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DispositivosService {

  constructor(private http: HttpClient) { }

  obtenerDispositivos(): Observable<any> {
    return this.http.get<any>(`${environment.API_SECURITY}/dispositivos`);
  }

  agregarDispositivo(data: FormData) {
    return this.http.post(environment.API_SECURITY + '/dispositivos', data);
  }

  eliminarDispositivo(idDispositivo: Number) {
		return this.http.delete(environment.API_SECURITY + '/dispositivos/' + idDispositivo);
	}

  obtenerDispositivo(idDispositivo: number): Observable<any> {
		return this.http.get<any>(environment.API_SECURITY + '/dispositivos/' + idDispositivo);
	}

  actualizarDispositivo(idDispositivo: number, saveForm: any): Observable<any> {
    return this.http.put(`${environment.API_SECURITY}/dispositivos/` + idDispositivo, saveForm);
  }
  
}
