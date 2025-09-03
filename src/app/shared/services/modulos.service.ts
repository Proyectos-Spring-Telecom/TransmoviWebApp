import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ModulosService {

  constructor(private http: HttpClient) { }
  private apiUrl = `${environment.API_SECURITY}/api/modulos`;

  obtenerModulos(): Observable<any> {
    return this.http.get<any>(`${environment.API_SECURITY}/modulos`);
  }

  agregarModulo(data: FormData) {
    return this.http.post(environment.API_SECURITY + '/modulos', data);
  }

  eliminarModulo(idModulo: Number) {
        return this.http.delete(environment.API_SECURITY + '/modulos/' + idModulo);
    }

  obtenerModulo(idModulo: number): Observable<any> {
        return this.http.get<any>(environment.API_SECURITY + '/modulos/' + idModulo);
    }

  actualizarModulo(idModulo: number, saveForm: any): Observable<any> {
    return this.http.put(`${environment.API_SECURITY}/modulos/` + idModulo, saveForm);
  }

  updateEstatus(id: number): Observable<string> {
        const url = `${this.apiUrl}/${id}`;
        return this.http.patch(url, {}, { responseType: 'text' }).pipe(
            catchError(error => {
              return throwError(error);
            })
    );
    }
  
}