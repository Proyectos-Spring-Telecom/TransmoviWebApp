import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OperadoresService {

  constructor(private http: HttpClient) { }

  obtenerOperadoresData(page: number, pageSize: number): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/operadores/${page}/${pageSize}`);
  }

  obtenerOperadores(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/operadores/list`);
  }

  agregarOperador(data: any) {
    return this.http.post(environment.API_SECURITY + '/operadores', data);
  }

  eliminarOperador(idDispositivo: Number) {
    return this.http.delete(environment.API_SECURITY + '/operadores/' + idDispositivo);
  }

  obtenerOperador(idDispositivo: number): Observable<any> {
    return this.http.get<any>(environment.API_SECURITY + '/operadores/' + idDispositivo);
  }

  actualizarOperador(idDispositivo: number, saveForm: any): Observable<any> {
    return this.http.put(`${environment.API_SECURITY}/operadores/` + idDispositivo, saveForm);
  }

  private apiUrl = `${environment.API_SECURITY}/operadores`;
  updateEstatus(id: number, estatus: number): Observable<string> {
    const url = `${this.apiUrl}/estatus/${id}`;
    const body = { estatus };
    return this.http.patch(url, body, { responseType: 'text' }).pipe(
      catchError(error => throwError(() => error))
    );
  }

  obtenerCaregoriasLicencia(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/catcategorialicencia/list`);
  }

  obtenerTiposLicencia(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/cattipolicencia/list`);
  }

  agregarLicencia(data: any) {
    return this.http.post(environment.API_SECURITY + '/licencias', data);
  }

  obtenerOperadoresByCliente(idCliente: number): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/operadores/by-cliente/${idCliente}`);
  }
}