import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class InstalacionesService {

  constructor(private http: HttpClient) { }

  obtenerInstalacionesData(page: number, pageSize: number): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/instalaciones/${page}/${pageSize}`);
  }

  obtenerInstalaciones(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/instalaciones/list`);
  }

  agregarInstalacion (data: any) {
    return this.http.post(environment.API_SECURITY + '/instalaciones', data);
  }

  eliminarInstalacion(idInstalacion: Number) {
    return this.http.delete(environment.API_SECURITY + '/instalaciones/' + idInstalacion);
  }

  obtenerInstalacion(idInstalacion: number): Observable<any> {
    return this.http.get<any>(environment.API_SECURITY + '/instalaciones/' + idInstalacion);
  }

  actualizarInstalacion(idInstalacion: number, saveForm: any): Observable<any> {
    return this.http.put(`${environment.API_SECURITY}/instalaciones/` + idInstalacion, saveForm);
  }

  private apiUrl = `${environment.API_SECURITY}/instalaciones`;
  updateEstatus(id: number, estatus: number): Observable<string> {
    const url = `${this.apiUrl}/estatus/${id}`;
    const body = { estatus };
    return this.http.patch(url, body, { responseType: 'text' }).pipe(
      catchError(error => throwError(() => error))
    );
  }
}