import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PosicioneService {

  constructor(private http: HttpClient) { }

  obtenerPosicionesData(page: number, pageSize: number): Observable<any> {
        return this.http.get(`${environment.API_SECURITY}/posiciones/${page}/${pageSize}`);
    }

  obtenerPosiciones(){
    return this.http.get(`${environment.API_SECURITY}/posiciones/list`);
  }

  agregarPosicion(data: FormData) {
    return this.http.post(environment.API_SECURITY + '/posiciones', data);
  }

  eliminarPosicion(idPosicion: number) {
        return this.http.delete(environment.API_SECURITY + '/posiciones/' + idPosicion);
    }

  obtenerPosicion(idPosicion: number): Observable<any> {
        return this.http.get<any>(environment.API_SECURITY + '/posiciones/' + idPosicion);
    }

  actualizarPosicion(idPosicion: number, saveForm: any): Observable<any> {
    return this.http.put(`${environment.API_SECURITY}/posiciones/` + idPosicion, saveForm);
  }

  private apiUrl = `${environment.API_SECURITY}/posiciones`;
  updateEstatus(id: number, estatus: number): Observable<string> {
    const url = `${this.apiUrl}/${id}/estatus`;
    const body = { estatus };
    return this.http.patch(url, body, { responseType: 'text' }).pipe(
      catchError(error => throwError(() => error))
    );
  }
  
}