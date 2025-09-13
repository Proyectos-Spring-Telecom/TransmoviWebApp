import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PermisosService {

  constructor(private http: HttpClient) { }

  obtenerPermisos(page: number, pageSize: number): Observable<any> {
		return this.http.get(`${environment.API_SECURITY}/permisos/${page}/${pageSize}`);
	}

  obtenerPermisosAgrupados(){
    return this.http.get(`${environment.API_SECURITY}/permisos/permisosAgrupados`);
  }

  agregarPermiso(data: FormData) {
    return this.http.post(environment.API_SECURITY + '/permisos', data);
  }

  eliminarPermiso(idPermiso: Number) {
        return this.http.delete(environment.API_SECURITY + '/permisos/' + idPermiso);
    }

  obtenerPermiso(idPermiso: number): Observable<any> {
        return this.http.get<any>(environment.API_SECURITY + '/permisos/' + idPermiso);
    }

  actualizarPermiso(idPermiso: number, saveForm: any): Observable<any> {
    return this.http.put(`${environment.API_SECURITY}/permisos/` + idPermiso, saveForm);
  }

  private apiUrl = `${environment.API_SECURITY}/permisos`;
  updateEstatus(id: number, estatus: number): Observable<string> {
    const url = `${this.apiUrl}/${id}/estatus`;
    const body = { estatus };
    return this.http.patch(url, body, { responseType: 'text' }).pipe(
      catchError(error => throwError(() => error))
    );
  }
  
}