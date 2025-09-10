import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RolesService {

  constructor(private http: HttpClient) { }

  obtenerRolesData(page: number, pageSize: number): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/roles/${page}/${pageSize}`);
  }

  obtenerRoles(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/roles/list`);
  }

  agregarRole(data: FormData) {
    return this.http.post(environment.API_SECURITY + '/roles', data);
  }

  eliminarRole(idModulo: Number) {
    return this.http.delete(environment.API_SECURITY + '/roles/' + idModulo);
  }

  obtenerRole(idModulo: number): Observable<any> {
    return this.http.get<any>(environment.API_SECURITY + '/roles/' + idModulo);
  }

  actualizarRoles(idModulo: number, saveForm: any): Observable<any> {
    return this.http.put(`${environment.API_SECURITY}/roles/` + idModulo, saveForm);
  }

  private apiUrl = `${environment.API_SECURITY}/roles`;
  updateEstatus(id: number, estatus: number): Observable<string> {
    const url = `${this.apiUrl}/estatus/${id}`;
    const body = { estatus };
    return this.http.patch(url, body, { responseType: 'text' }).pipe(
      catchError(error => throwError(() => error))
    );
  }
}