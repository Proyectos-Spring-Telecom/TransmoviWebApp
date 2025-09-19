import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BlueVoxService {

  constructor(private http: HttpClient) { }

  obtenerBViajesData(page: number, pageSize: number): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/conteopasajeros/${page}/${pageSize}`);
  }

  obtenerBViajes(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/conteopasajeros/list`);
  }

  agregarBViajes(data: FormData) {
    return this.http.post(environment.API_SECURITY + '/conteopasajeros', data);
  }

  obtenerBViajesRango(fechaInicio: string, fechaFin: string, page: number, pageSize: number): Observable<any> {
    const fi = encodeURIComponent(fechaInicio);
    const ff = encodeURIComponent(fechaFin);
    return this.http.get(
      `${environment.API_SECURITY}/conteopasajeros/rango/${fi}/${ff}?page=${page}&limit=${pageSize}`
    );
  }

}