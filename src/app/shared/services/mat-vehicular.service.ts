import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MantenimientoVehicularService {

  constructor(private http: HttpClient) { }

  obtenerManVehicularesData(page: number, pageSize: number): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/mantenimiento-vehicular/${page}/${pageSize}`);
  }

  obtenerManVehiculares(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/mantenimiento-vehicular/list`);
  }

  agregarMatVehicular(data: any) {
    return this.http.post(environment.API_SECURITY + '/mantenimiento-vehicular', data);
  }

  eliminarMatVehicular(idManVehicular: Number) {
    return this.http.delete(environment.API_SECURITY + '/mantenimiento-vehicular/' + idManVehicular);
  }

  obtenerMatVehicular(idManVehicular: number): Observable<any> {
    return this.http.get<any>(environment.API_SECURITY + '/mantenimiento-vehicular/' + idManVehicular);
  }

  actualizarMatVehicular(idManVehicular: number, payload: any): Observable<any> {
    return this.http.patch(
      `${environment.API_SECURITY}/mantenimiento-vehicular/${idManVehicular}`,
      payload
    );
  }

  private apiUrl = `${environment.API_SECURITY}/mantenimiento-vehicular`;
  activarMantenimiento(id: number): Observable<string> {
    const url = `${this.apiUrl}/${id}/activar`;
    return this.http.patch(url, null, { responseType: 'text' }).pipe(
      catchError(error => throwError(() => error))
    );
  }

  desactivarMantenimiento(id: number): Observable<string> {
    const url = `${this.apiUrl}/${id}/desactivar`;
    return this.http.patch(url, null, { responseType: 'text' }).pipe(
      catchError(error => throwError(() => error))
    );
  }

}