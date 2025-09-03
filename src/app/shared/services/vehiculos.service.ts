import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class VehiculosService {

  constructor(private http: HttpClient) { }
  private apiUrl = `${environment.API_SECURITY}/api/vehiculos`;

  obtenerVehiculos(): Observable<any> {
    return this.http.get<any>(`${environment.API_SECURITY}/vehiculos`);
  }

  agregarVehiculo(data: FormData) {
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

  updateEstatus(id: number): Observable<string> {
		const url = `${this.apiUrl}/${id}`;
		return this.http.patch(url, {}, { responseType: 'text' }).pipe(
			catchError(error => {
			  return throwError(error);
			})
    );
	}
  
}