import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TallereService {

  constructor(private http: HttpClient) { }

  obtenerTalleresData(page: number, pageSize: number): Observable<any> {
        return this.http.get(`${environment.API_SECURITY}/talleres/${page}/${pageSize}`);
    }


  agregarTaller(data: FormData) {
    return this.http.post(environment.API_SECURITY + '/talleres', data);
  }

  eliminarTaller(idTaller: number) {
        return this.http.delete(environment.API_SECURITY + '/talleres/' + idTaller);
    }

  obtenerTalleres(idTaller: number): Observable<any> {
        return this.http.get<any>(environment.API_SECURITY + '/talleres/' + idTaller);
    }

  actualizarTaller(idTaller: number, saveForm: any): Observable<any> {
    return this.http.put(`${environment.API_SECURITY}/talleres/` + idTaller, saveForm);
  }

  private apiUrl = `${environment.API_SECURITY}/talleres`;
  updateEstatus(id: number, estatus: number): Observable<string> {
    const url = `${this.apiUrl}/${id}/estatus`;
    const body = { estatus };
    return this.http.patch(url, body, { responseType: 'text' }).pipe(
      catchError(error => throwError(() => error))
    );
  }
  
}