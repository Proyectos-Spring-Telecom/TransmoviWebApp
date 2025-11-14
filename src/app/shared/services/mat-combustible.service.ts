import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MantenimientoCombustibleService {
  constructor(private http: HttpClient) { }

  obtenerManCombustiblesData(page: number, pageSize: number): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/mantenimiento-combustible/${page}/${pageSize}`);
  }

  obtenerManCombustible(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/mantenimiento-combustible/list`);
  }

  agregarMatCombustible(data: FormData) {
    return this.http.post(environment.API_SECURITY + '/mantenimiento-combustible', data);
  }

  eliminarMatCombustible(idMatCombustible: Number) {
    return this.http.delete(environment.API_SECURITY + '/mantenimiento-combustible/' + idMatCombustible);
  }

  obtenerMatCombustible(idMatCombustible: number): Observable<any> {
    return this.http.get<any>(environment.API_SECURITY + '/mantenimiento-combustible/' + idMatCombustible);
  }

  actualizarMatCombustible(idMatCombustible: number, saveForm: any): Observable<any> {
    return this.http.put(`${environment.API_SECURITY}/mantenimiento-combustible/` + idMatCombustible, saveForm);
  }

  private apiUrl = `${environment.API_SECURITY}/mantenimiento-combustible`;
  updateEstatus(id: number, estatus: number): Observable<string> {
    const url = `${this.apiUrl}/${id}/estatus`;
    const body = { estatus };
    return this.http.patch(url, body, { responseType: 'text' }).pipe(
      catchError(error => throwError(() => error))
    );
  }
}