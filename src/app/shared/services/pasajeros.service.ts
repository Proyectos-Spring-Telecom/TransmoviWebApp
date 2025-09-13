import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PasajerosService {

  constructor(private http: HttpClient) { }

  obtenerPasajerosData(page: number, pageSize: number): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/pasajeros/${page}/${pageSize}`);
  }

  obtenerPasajeros(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/pasajeros/list`);
  }

  agregarPasajero(data: FormData) {
    return this.http.post(environment.API_SECURITY + '/pasajeros', data);
  }

  eliminarPasajero(idDispositivo: Number) {
    return this.http.delete(environment.API_SECURITY + '/pasajeros/' + idDispositivo);
  }

  obtenerPasajero(idDispositivo: number): Observable<any> {
    return this.http.get<any>(environment.API_SECURITY + '/pasajeros/' + idDispositivo);
  }

  actualizarPasajero(idDispositivo: number, saveForm: any): Observable<any> {
    return this.http.put(`${environment.API_SECURITY}/pasajeros/` + idDispositivo, saveForm);
  }

  private apiUrl = `${environment.API_SECURITY}/pasajeros`;
  updateEstatus(id: number, estatus: number): Observable<string> {
    const url = `${this.apiUrl}/estatus/${id}`;
    const body = { estatus };
    return this.http.patch(url, body, { responseType: 'text' }).pipe(
      catchError(error => throwError(() => error))
    );
  }
}