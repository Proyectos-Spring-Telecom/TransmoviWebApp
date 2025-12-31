import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ViajeService {

  constructor(private http: HttpClient) { }

  obtenerViajesFiltro(body: {
    page: number;
    limit: number;
    fechaInicio?: string | null;
    fechaFin?: string | null;
  }): Observable<any> {
    return this.http.post(
      `${environment.API_SECURITY}/viajes/paginado`,
      body
    );
  }

  obtenerViajesData(page: number, pageSize: number): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/viajes/${page}/${pageSize}`);
  }

  obtenerViaje(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/viajes/list`);
  }

  agregarViaje(data: any) {
    return this.http.post(environment.API_SECURITY + '/viajes', data);
  }

  recargaViaje(data: any) {
    return this.http.post(environment.API_SECURITY + '/viajes/recarga', data);
  }

  debitoViaje(data: any) {
    return this.http.post(environment.API_SECURITY + '/viajes/debito', data);
  }

}