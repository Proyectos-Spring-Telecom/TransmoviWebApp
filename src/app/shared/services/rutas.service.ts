import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RutasService {

  constructor(private http: HttpClient) { }

  obtenerRutas(): Observable<any> {
    return this.http.get<any>(`https://transmovi.mx/api/ruta/rutas`);
  }

  detallarRuta(saveForm: any): Observable<any> {
    return this.http.post(`https://transmovi.mx/api/ruta/rutas/detallar`, saveForm);
  }

  guardarRutas(saveForm: any): Observable<any> {
    return this.http.post(`https://transmovi.mx/api/ruta/rutas/guardar`, saveForm);
  }

  configurarTarifa(saveForm: any): Observable<any> {
    return this.http.post(`https://transmovi.mx/api/ruta/tarifas/configurar`, saveForm);
  }

  obtenerRuta(idRuta: any): Observable<any> {
		return this.http.get<any>('https://transmovi.mx/api/ruta/rutas/' + idRuta);
	}
  
}