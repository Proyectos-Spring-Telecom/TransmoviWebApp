import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CatCombustibleService {

  constructor(private http: HttpClient) { }

  obtenerCombustiblesData(page: number, pageSize: number): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/cat-tipo-combustible/${page}/${pageSize}`);
  }

  obtenerCombustibles(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/cat-tipo-combustible/list`);
  }

  agregarCombustible(data: any) {
    return this.http.post(environment.API_SECURITY + '/cat-tipo-combustible', data);
  }

  eliminarCombustible(idCatCombustible: Number) {
    return this.http.delete(environment.API_SECURITY + '/cat-tipo-combustible/eliminado/total/' + idCatCombustible);
  }

  obtenerCombustible(idCatCombustible: number): Observable<any> {
    return this.http.get<any>(environment.API_SECURITY + '/cat-tipo-combustible/' + idCatCombustible);
  }

  actualizarCombustible(idCatCombustible: number, saveForm: any): Observable<any> {
    return this.http.put(`${environment.API_SECURITY}/cat-tipo-combustible/` + idCatCombustible, saveForm);
  }

  private apiUrl = `${environment.API_SECURITY}/cat-tipo-combustible`;
  updateEstatus(id: number, estatus: number): Observable<string> {
    const url = `${this.apiUrl}/estatus/${id}`;
    const body = { estatus };
    return this.http.patch(url, body, { responseType: 'text' }).pipe(
      catchError(error => throwError(() => error))
    );
  }
}