import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class VerificacionesService {

  constructor(private http: HttpClient) { }
  
  obtenerVerificacionesData(page: number, limit: number): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get(`${environment.API_SECURITY}/verificaciones`, { params });
  }

  obtenerVerificaciones(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/verificaciones/list`);
  }

  agregarVerificacion(data: any) {
    return this.http.post(environment.API_SECURITY + '/verificaciones', data);
  }

  eliminarVerificacion(idVerificacion: Number) {
    return this.http.delete(environment.API_SECURITY + '/verificaciones/' + idVerificacion);
  }

  obtenerVerificacion(idVerificacion: any): Observable<any> {
    return this.http.get<any>(environment.API_SECURITY + '/verificaciones/' + idVerificacion);
  }

  actualizarVerificacion(idVerificacion: number, saveForm: any): Observable<any> {
    return this.http.patch(
      `${environment.API_SECURITY}/verificaciones/${idVerificacion}`,
      saveForm
    );
  }

  private apiUrl = `${environment.API_SECURITY}/verificaciones`;
  activarVerificacion(id: number): Observable<string> {
    const url = `${this.apiUrl}/${id}/activar`;
    return this.http.patch(url, null, { responseType: 'text' }).pipe(
      catchError(error => throwError(() => error))
    );
  }

  desactivarVerificacion(id: number): Observable<string> {
    const url = `${this.apiUrl}/${id}/desactivar`;
    return this.http.patch(url, null, { responseType: 'text' }).pipe(
      catchError(error => throwError(() => error))
    );
  }

  //
  obtenerTipoVerificaciones(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/cat-tipo-verificaciones/list`);
  }
}