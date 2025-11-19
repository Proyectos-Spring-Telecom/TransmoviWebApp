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

  obtenerVehiculosByCliente(idCliente: any): Observable<any> {
    const base = environment.API_SECURITY;

    const u1 = `${base}/vehiculos/clientes/${idCliente}`;  // ruta actual (falla 404)
    const u2 = `${base}/vehiculos/cliente/${idCliente}`;   // variante singular
    const u3 = `${base}/clientes/${idCliente}/vehiculos`;  // variante anidada

    const ensureData = (resp: any) => {
      const arr =
        Array.isArray(resp) ? resp :
          Array.isArray(resp?.data) ? resp.data :
            Array.isArray(resp?.vehiculos) ? resp.vehiculos :
              [];
      return { data: arr }; // <- siempre regresa { data: [] } para el componente
    };

    return this.http.get(u1).pipe(
      // si u1 da 404, intenta u2
      catchError(err1 => err1?.status === 404 ? this.http.get(u2) : throwError(() => err1)),
      // si u2 también da 404, intenta u3
      catchError(err2 => err2?.status === 404 ? this.http.get(u3) : throwError(() => err2)),
      // normaliza shape
      map(ensureData),
      // última red: nunca rompas el flujo
      catchError(() => of({ data: [] })),
    );
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