import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RutasService {

  constructor(private http: HttpClient) { }

  // obtenerRutas(): Observable<any> {
  //   return this.http.get<any>(`https://transmovi.mx/api/ruta/rutas`);
  // }

  // detallarRuta(saveForm: any): Observable<any> {
  //   return this.http.post(`https://transmovi.mx/api/ruta/rutas/detallar`, saveForm);
  // }

  // guardarRutas(saveForm: any): Observable<any> {
  //   return this.http.post(`https://transmovi.mx/api/ruta/rutas/guardar`, saveForm);
  // }

  // configurarTarifa(saveForm: any): Observable<any> {
  //   return this.http.post(`https://transmovi.mx/api/ruta/tarifas/configurar`, saveForm);
  // }

  // obtenerRuta(idRuta: any): Observable<any> {
	// 	return this.http.get<any>('https://transmovi.mx/api/ruta/rutas/' + idRuta);
	// }


  obtenerRutasData(page: number, pageSize: number): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/rutas/${page}/${pageSize}`);
  }

  obtenerRutas(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/rutas/list`);
  }

  // rutas.service.ts
agregarRuta(payload: any) {
  return this.http.post(`${environment.API_SECURITY}/rutas`, payload);
}


  eliminarRuta(idRuta: number) {
    return this.http.delete(environment.API_SECURITY + '/rutas/' + idRuta);
  }

  obtenerRuta(idRuta: number): Observable<any> {
    return this.http.get<any>(environment.API_SECURITY + '/rutas/' + idRuta);
  }

  actualizarRuta(idRuta: number, saveForm: any): Observable<any> {
    return this.http.put(`${environment.API_SECURITY}/rutas/` + idRuta, saveForm);
  }

  obtenerRutasByRegion(idRegion: number): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/rutas/by-region/${idRegion}`);
  }

  private apiUrl = `${environment.API_SECURITY}/rutas`;
  updateEstatus(id: number, estatus: number): Observable<string> {
    const url = `${this.apiUrl}/estatus/${id}`;
    const body = { estatus };
    return this.http.patch(url, body, { responseType: 'text' }).pipe(
      catchError(error => throwError(() => error))
    );
  }
  
}