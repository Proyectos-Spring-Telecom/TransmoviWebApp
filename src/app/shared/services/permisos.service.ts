import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PermisosService {

  constructor(private http: HttpClient) { }
  private apiUrl = `${environment.API_SECURITY}/api/permisos`;

  obtenerPermisos(page: number, pageSize: number): Observable<any> {
		return this.http.get(`${environment.API_SECURITY}/permisos/page/${page}/${pageSize}`);
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

  updateEstatus(id: number): Observable<string> {
        const url = `${this.apiUrl}/${id}`;
        return this.http.patch(url, {}, { responseType: 'text' }).pipe(
            catchError(error => {
              return throwError(error);
            })
    );
    }
  
}