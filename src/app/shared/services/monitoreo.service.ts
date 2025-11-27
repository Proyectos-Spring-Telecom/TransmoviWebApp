import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class MonitoreoService {

    constructor(private http: HttpClient) { }

    obtenerMonitoreoData(page: number, pageSize: number): Observable<any> {
        return this.http.get(`${environment.API_SECURITY}/monitoreo/${page}/${pageSize}`);
    }

    obtenerMonitoreo(): Observable<any> {
        return this.http.get(`${environment.API_SECURITY}/monitoreo/list`);
    }

    obtenerMonitoreoByCliente(idCliente: number): Observable<any> {
        return this.http.get<any>(environment.API_SECURITY + '/monitoreo/list/' + idCliente);
    }

    obtenerRecorridoDelDia(idCliente: number, numeroSerieDispositivo: string): Observable<any> {
        const body = {
            idCliente: idCliente,
            NumeroSerieDispositivo: numeroSerieDispositivo
        };

        return this.http.post<any>(
            `${environment.API_SECURITY}/monitoreo/recorrido`,
            body
        );
    }
}