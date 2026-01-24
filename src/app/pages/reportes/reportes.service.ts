import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface RecaudacionDiariaRutaRequest {
  fechaInicio: string;
  fechaFin: string;
  idCliente?: number | null;
  idRegion?: number | null;
  idRuta?: number | null;
  idDerrotero?: number | null;
}

export interface RecaudacionOperadorRequest {
  fechaInicio: string;
  fechaFin: string;
  idCliente?: number | null;
  idOperador?: number | null;
}

export interface RecaudacionVehiculoRequest {
  fechaInicio: string;
  fechaFin: string;
  idCliente?: number | null;
  idVehiculo?: number | null;
  idRuta?: number | null;
}

export interface RecaudacionDispositivoRequest {
  fechaInicio: string;
  fechaFin: string;
  idCliente?: number | null;
  idDispositivo?: number | null;
  idInstalacion?: number | null;
}

export interface ValidacionesDetalladasRequest {
  fechaInicio: string;
  fechaFin: string;
  idCliente?: number | null;
  idRuta?: number | null;
  idDerrotero?: number | null;
  idOperador?: number | null;
  idVehiculo?: number | null;
  idDispositivo?: number | null;
}

@Injectable({
  providedIn: 'root',
})
export class ReportesService {
  constructor(private http: HttpClient) {}

  obtenerRecaudacionDiariaPorRuta(
    payload: RecaudacionDiariaRutaRequest
  ): Observable<any> {
    return this.http.post(
      `${environment.API_SECURITY}/reportes/recaudacion-diaria-ruta`,
      payload
    );
  }

  obtenerRecaudacionPorOperador(
    payload: RecaudacionOperadorRequest
  ): Observable<any> {
    return this.http.post(
      `${environment.API_SECURITY}/reportes/recaudacion-por-operador`,
      payload
    );
  }

  obtenerRecaudacionPorVehiculo(
    payload: RecaudacionVehiculoRequest
  ): Observable<any> {
    return this.http.post(
      `${environment.API_SECURITY}/reportes/recaudacion-por-vehiculo`,
      payload
    );
  }

  obtenerRecaudacionPorDispositivo(
    payload: RecaudacionDispositivoRequest
  ): Observable<any> {
    return this.http.post(
      `${environment.API_SECURITY}/reportes/recaudacion-por-dispositivo`,
      payload
    );
  }

  obtenerValidacionesDetalladas(
    payload: ValidacionesDetalladasRequest
  ): Observable<any> {
    return this.http.post(
      `${environment.API_SECURITY}/reportes/validaciones-detalladas`,
      payload
    );
  }
}

