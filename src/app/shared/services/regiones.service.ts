import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RegionesService {

  constructor(private http: HttpClient) { }

  obtenerRegionesData(page: number, pageSize: number): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/regiones/${page}/${pageSize}`);
  }

  obtenerRegiones(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/regiones/list`);
  }

  agregarRegion(data: any) {
    return this.http.post(environment.API_SECURITY + '/regiones', data);
  }

  eliminarRegion(idRegion: Number) {
    return this.http.delete(environment.API_SECURITY + '/regiones/' + idRegion);
  }

  obtenerRegion(idRegion: number): Observable<any> {
    return this.http.get<any>(environment.API_SECURITY + '/regiones/' + idRegion);
  }

  actualizarRegion(idRegion: number, saveForm: any): Observable<any> {
    return this.http.put(`${environment.API_SECURITY}/regiones/` + idRegion, saveForm);
  }

  obtenerRegionesByCliente(idCliente: number): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/regiones/by-cliente/${idCliente}`);
  }

  private apiUrl = `${environment.API_SECURITY}/regiones`;
  updateEstatus(id: number, estatus: number): Observable<string> {
    const url = `${this.apiUrl}/estatus/${id}`;
    const body = { estatus };
    return this.http.patch(url, body, { responseType: 'text' }).pipe(
      catchError(error => throwError(() => error))
    );
  }
}