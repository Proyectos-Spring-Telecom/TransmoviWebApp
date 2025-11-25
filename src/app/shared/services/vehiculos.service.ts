import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class VehiculosService {

  constructor(private http: HttpClient) { }

  obtenerVehiculosData(page: number, pageSize: number): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/vehiculos/${page}/${pageSize}`);
  }

  obtenerVehiculos(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/vehiculos/list`);
  }

  obtenerVehiculosByCliente(idCliente: number): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/vehiculos/by-cliente/${idCliente}`);
  }

  agregarVehiculo(data: any) {
    return this.http.post(environment.API_SECURITY + '/vehiculos', data);
  }

  eliminarVehiculo(idVehiculo: Number) {
    return this.http.delete(environment.API_SECURITY + '/vehiculos/' + idVehiculo);
  }

  obtenerVehiculo(idVehiculo: number): Observable<any> {
    return this.http.get<any>(environment.API_SECURITY + '/vehiculos/' + idVehiculo);
  }

  actualizarVehiculo(idVehiculo: number, saveForm: any): Observable<any> {
    return this.http.put(`${environment.API_SECURITY}/vehiculos/` + idVehiculo, saveForm);
  }

  private apiUrl = `${environment.API_SECURITY}/vehiculos`;
  updateEstatus(id: number, estatus: number): Observable<string> {
    const url = `${this.apiUrl}/estatus/${id}`;
    const body = { estatus };
    return this.http.patch(url, body, { responseType: 'text' }).pipe(
      catchError(error => throwError(() => error))
    );
  }

  obtenerCombustibles(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/cat-tipo-combustible/list`);
  }
}