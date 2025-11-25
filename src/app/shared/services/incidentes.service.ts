import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class IncidenteService {

  constructor(private http: HttpClient) { }
  
  obtenerIncidentesData(page: number, limit: number): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get(`${environment.API_SECURITY}/incidentes`, { params });
  }

  obtenerIncidentes(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/incidentes/list`);
  }

  agregarIncidente(data: any) {
    return this.http.post(environment.API_SECURITY + '/incidentes', data);
  }

  eliminarIncidente(idIncidente: Number) {
    return this.http.delete(environment.API_SECURITY + '/incidentes/' + idIncidente);
  }

  obtenerIncidente(idIncidente: any): Observable<any> {
    return this.http.get<any>(environment.API_SECURITY + '/incidentes/' + idIncidente);
  }

  actualizarIncidente(idIncidente: number, saveForm: any): Observable<any> {
    return this.http.patch(
      `${environment.API_SECURITY}/incidentes/${idIncidente}`,
      saveForm
    );
  }

  private apiUrl = `${environment.API_SECURITY}/incidentes`;
  activarIncidente(id: number): Observable<string> {
    const url = `${this.apiUrl}/${id}/activar`;
    return this.http.patch(url, null, { responseType: 'text' }).pipe(
      catchError(error => throwError(() => error))
    );
  }

  desactivarIncidente(id: number): Observable<string> {
    const url = `${this.apiUrl}/${id}/desactivar`;
    return this.http.patch(url, null, { responseType: 'text' }).pipe(
      catchError(error => throwError(() => error))
    );
  }

  //
  obtenerTipoincidentes(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/cat-tipo-incidentes/list`);
  }
}