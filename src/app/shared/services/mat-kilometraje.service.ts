import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MantenimientoKilometrosService {

  constructor(private http: HttpClient) { }

  obtenerManKilometroData(page: number, pageSize: number): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/mantenimiento-kilometraje/${page}/${pageSize}`);
  }

  obtenerManKilometraje(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/mantenimiento-kilometraje/list`);
  }

  agregarMatKilometraje(data: any) {
    return this.http.post(environment.API_SECURITY + '/mantenimiento-kilometraje', data);
  }

  eliminarMatKilometraje(idKilometraje: Number) {
    return this.http.delete(environment.API_SECURITY + '/mantenimiento-kilometraje/' + idKilometraje);
  }

  obtenerMatKilometraje(idKilometraje: number): Observable<any> {
    return this.http.get<any>(environment.API_SECURITY + '/mantenimiento-kilometraje/' + idKilometraje);
  }

  actualizarMatKilometraje(idKilometraje: number, saveForm: any): Observable<any> {
    return this.http.patch(
      `${environment.API_SECURITY}/mantenimiento-kilometraje/${idKilometraje}`,
      saveForm
    );
  }

  private apiUrl = `${environment.API_SECURITY}/mantenimiento-kilometraje`;
  activar(id: number): Observable<string> {
    const url = `${this.apiUrl}/${id}/activar`;
    return this.http.patch(url, null, { responseType: 'text' }).pipe(
      catchError(error => throwError(() => error))
    );
  }

  desactivar(id: number): Observable<string> {
    const url = `${this.apiUrl}/${id}/desactivar`;
    return this.http.patch(url, null, { responseType: 'text' }).pipe(
      catchError(error => throwError(() => error))
    );
  }

}