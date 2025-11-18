import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TallereService {
  constructor(private http: HttpClient) {}

  obtenerTalleresData(page: number, pageSize: number): Observable<any> {
    return this.http.get(
      `${environment.API_SECURITY}/talleres/${page}/${pageSize}`
    );
  }

  obtenerTalleres(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/talleres/list`);
  }

  agregarTaller(data: any) {
    return this.http.post(environment.API_SECURITY + '/talleres', data);
  }

  eliminarTaller(idTaller: number) {
    return this.http.delete(environment.API_SECURITY + '/talleres/' + idTaller);
  }

  obtenerTaller(idTaller: number): Observable<any> {
    return this.http.get<any>(
      environment.API_SECURITY + '/talleres/' + idTaller
    );
  }

  actualizarTaller(idTaller: number, saveForm: any): Observable<any> {
    return this.http.patch(
      `${environment.API_SECURITY}/talleres/${idTaller}`,
      saveForm
    );
  }

  private apiUrl = `${environment.API_SECURITY}/talleres`;

  activarTaller(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/activar/${id}`, null, { responseType: 'text' as 'json' });
  }

  desactivarTaller(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/desactivar/${id}`, null, { responseType: 'text' as 'json' });
  }

}
