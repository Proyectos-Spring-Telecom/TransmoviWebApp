import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class TarifasService {

    constructor(private http: HttpClient) { }

    obtenerTarifasData(page: number, pageSize: number): Observable<any> {
        return this.http.get(`${environment.API_SECURITY}/tarifas/${page}/${pageSize}`);
    }

    obtenerTarifas(): Observable<any> {
        return this.http.get(`${environment.API_SECURITY}/tarifas/list`);
    }

    agregarTarifa(data: any) {
        return this.http.post(environment.API_SECURITY + '/tarifas', data);
    }

    eliminarTarifa(idTarifa: Number) {
        return this.http.delete(environment.API_SECURITY + '/tarifas/' + idTarifa);
    }

    obtenerTarifa(idTarifa: number): Observable<any> {
        return this.http.get<any>(environment.API_SECURITY + '/tarifas/' + idTarifa);
    }

    actualizarTarifa(idTarifa: number, saveForm: any): Observable<any> {
        return this.http.put(`${environment.API_SECURITY}/tarifas/` + idTarifa, saveForm);
    }

    private apiUrl = `${environment.API_SECURITY}/tarifas`;
    updateEstatus(id: number, estatus: number): Observable<string> {
        const url = `${this.apiUrl}/estatus/${id}`;
        const body = { estatus };
        return this.http.patch(url, body, { responseType: 'text' }).pipe(
            catchError(error => throwError(() => error))
        );
    }

}