import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DispositivosService {

  constructor(private http: HttpClient) { }

  obtenerDispositivosData(page: number, pageSize: number): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/dispositivos/${page}/${pageSize}`);
  }

  obtenerDispositivos(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/dispositivos/list`);
  }

  obtenerDispositivosByCliente(idCliente: any): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/dispositivos/by-cliente/${idCliente}`);
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

  private apiUrl = `${environment.API_SECURITY}/dispositivos`;
  updateEstatus(id: number, estatus: number): Observable<string> {
    const url = `${this.apiUrl}/estatus/${id}`;
    const body = { estatus };
    return this.http.patch(url, body, { responseType: 'text' }).pipe(
      catchError(error => throwError(() => error))
    );
  }

  actualizarEstadoDispositivo(idDispositivo: number, estadoActual: number): Observable<any> {
    const url = `${environment.API_SECURITY}/dispositivos/actualizar/estado/${idDispositivo}`;
    const body = { estadoActual };
    return this.http.patch<any>(url, body);
  }
}