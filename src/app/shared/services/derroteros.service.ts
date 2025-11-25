import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DerroterosService {

  constructor(private http: HttpClient) { }

  obtenerDerroterosData(page: number, pageSize: number): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/derroteros/${page}/${pageSize}`);
  }

  obtenerDerroteros(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/derroteros/list`);
  }

  agregarDerrotero(data: any) {
    return this.http.post(environment.API_SECURITY + '/derroteros', data);
  }

  eliminarDerrotero(idDerrotero: Number) {
    return this.http.delete(environment.API_SECURITY + '/derroteros/eliminado/total/' + idDerrotero);
  }

  obtenerDerrotero(idDerrotero: number): Observable<any> {
    return this.http.get<any>(environment.API_SECURITY + '/derroteros/' + idDerrotero);
  }

  actualizarDerrotero(idDerrotero: number, saveForm: any): Observable<any> {
    return this.http.put(`${environment.API_SECURITY}/derroteros/` + idDerrotero, saveForm);
  }

  obtenerDerroterosByRuta(idRuta: number): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/derroteros/by-ruta/${idRuta}`);
  }

  private apiUrl = `${environment.API_SECURITY}/derroteros`;
  updateEstatus(id: number, estatus: number): Observable<string> {
    const url = `${this.apiUrl}/estatus/${id}`;
    const body = { estatus };
    return this.http.patch(url, body, { responseType: 'text' }).pipe(
      catchError(error => throwError(() => error))
    );
  }
}