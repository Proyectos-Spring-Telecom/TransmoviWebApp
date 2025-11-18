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

  actualizarMatVehicular(idManVehicular: number, saveForm: any): Observable<any> {
    return this.http.put(`${environment.API_SECURITY}/mantenimiento-vehicular/` + idManVehicular, saveForm);
  }

  private apiUrl = `${environment.API_SECURITY}/mantenimiento-vehicular`;
  updateEstatus(id: number, estatus: number): Observable<string> {
    const url = `${this.apiUrl}/${id}/estatus`;
    const body = { estatus };
    return this.http.patch(url, body, { responseType: 'text' }).pipe(
      catchError(error => throwError(() => error))
    );
  }
}