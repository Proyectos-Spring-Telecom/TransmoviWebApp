import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ModulosService {

  constructor(private http: HttpClient) { }

  obtenerModuloData(page: number, pageSize: number): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/modulos/${page}/${pageSize}`);
  }

  obtenerModulos(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/modulos/list`);
  }

  agregarModulo(data: FormData) {
    return this.http.post(environment.API_SECURITY + '/modulos', data);
  }

  eliminarModulo(idModulo: Number) {
    return this.http.delete(environment.API_SECURITY + '/modulos/' + idModulo);
  }

  obtenerModulo(idModulo: number): Observable<any> {
    return this.http.get<any>(environment.API_SECURITY + '/modulos/' + idModulo);
  }

  actualizarModulo(idModulo: number, saveForm: any): Observable<any> {
    return this.http.put(`${environment.API_SECURITY}/modulos/` + idModulo, saveForm);
  }

  private apiUrl = `${environment.API_SECURITY}/modulos`;
  updateEstatus(id: number, estatus: number): Observable<string> {
    const url = `${this.apiUrl}/${id}/estatus`;
    const body = { estatus };
    return this.http.patch(url, body, { responseType: 'text' }).pipe(
      catchError(error => throwError(() => error))
    );
  }
}