import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DispositivoBluevoxService {

  constructor(private http: HttpClient) { }

  obtenerDispositivosBlueData(page: number, pageSize: number): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/bluevox/${page}/${pageSize}`);
  }

  obtenerDispositivosBlue(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/bluevox/list`);
  }

  obtenerDispositivosBlueByCliente(idCliente: any): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/bluevox/clientes/${idCliente}`);
  }

  agregarDispositivoBlue(data: FormData) {
    return this.http.post(environment.API_SECURITY + '/bluevox', data);
  }

  eliminarDispositivoBlue(idDispositivo: Number) {
    return this.http.delete(environment.API_SECURITY + '/bluevox/' + idDispositivo);
  }

  obtenerDispositivoBlue(idDispositivo: number): Observable<any> {
    return this.http.get<any>(environment.API_SECURITY + '/bluevox/' + idDispositivo);
  }

  actualizarDispositivoBlue(idDispositivo: number, saveForm: any): Observable<any> {
    return this.http.put(`${environment.API_SECURITY}/bluevox/` + idDispositivo, saveForm);
  }

  private apiUrl = `${environment.API_SECURITY}/bluevox`;
  updateEstatus(id: number, estatus: number): Observable<string> {
    const url = `${this.apiUrl}/estatus/${id}`;
    const body = { estatus };
    return this.http.patch(url, body, { responseType: 'text' }).pipe(
      catchError(error => throwError(() => error))
    );
  }

  actualizarEstadoDispositivo(idDispositivo: number, estadoActual: number): Observable<any> {
    const url = `${environment.API_SECURITY}/bluevox/actualizar/estado/${idDispositivo}`;
    const body = { estadoActual };
    return this.http.patch<any>(url, body);
  }

}