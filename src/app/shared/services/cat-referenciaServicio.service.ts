import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CatReferenciaService {

  constructor(private http: HttpClient) { }

  obtenerReferenciaServiciosData(page: number, pageSize: number): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/cat-referencia-servicio/${page}/${pageSize}`);
  }

  obtenerReferenciaServicios(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/cat-referencia-servicio/list`);
  }

  agregarReferenciaServicio(data: any) {
    return this.http.post(environment.API_SECURITY + '/cat-referencia-servicio', data);
  }

  eliminarReferenciaServicio(idCatReferencia: Number) {
    return this.http.delete(environment.API_SECURITY + '/cat-referencia-servicio/eliminado/total/' + idCatReferencia);
  }

  obtenerReferenciaServicio(idCatReferencia: number): Observable<any> {
    return this.http.get<any>(environment.API_SECURITY + '/cat-referencia-servicio/' + idCatReferencia);
  }

  actualizarReferenciaServicio(idCatReferencia: number, saveForm: any): Observable<any> {
    return this.http.put(`${environment.API_SECURITY}/cat-referencia-servicio/` + idCatReferencia, saveForm);
  }

  private apiUrl = `${environment.API_SECURITY}/cat-referencia-servicio`;
  updateEstatus(id: number, estatus: number): Observable<string> {
    const url = `${this.apiUrl}/estatus/${id}`;
    const body = { estatus };
    return this.http.patch(url, body, { responseType: 'text' }).pipe(
      catchError(error => throwError(() => error))
    );
  }
}