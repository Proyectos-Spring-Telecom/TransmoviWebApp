import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BitacoraService {

  constructor(private http: HttpClient) { }

  obtenerBitacoraData(page: number, pageSize: number): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/bitacora/${page}/${pageSize}`);
  }

  obtenerBitacora(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/bitacora/list`);
  }
  
}
