import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PasajerosService {

  constructor(private http: HttpClient) { }

  obtenerPasajeros(): Observable<any> {
    return this.http.get<any>(`${environment.API_SECURITY}/pasajeros`);
  }

  agregarPasajero(data: FormData) {
    return this.http.post(environment.API_SECURITY + '/pasajeros', data);
  }

  eliminarPasajero(idPasajero: Number) {
		return this.http.delete(environment.API_SECURITY + '/pasajeros/' + idPasajero);
	}

  obtenerPasajero(idPasajero: number): Observable<any> {
		return this.http.get<any>(environment.API_SECURITY + '/pasajeros/' + idPasajero);
	}

  actualizarPasajero(idPasajero: number, saveForm: any): Observable<any> {
    return this.http.put(`${environment.API_SECURITY}/pasajeros/` + idPasajero, saveForm);
  }
  
}
