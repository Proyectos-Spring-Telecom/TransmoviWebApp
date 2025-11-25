import { HttpClient, HttpHeaders, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SKIP_APP_AUTH } from 'src/app/account/auth/login/intercept.service';

@Injectable({
  providedIn: 'root'
})
export class PasajerosService {
  private readonly VERIFY_TOKEN_KEY = 'verify_token';
  private apiUrl = `${environment.API_SECURITY}/pasajeros`;

  constructor(private http: HttpClient) { }

  setVerificationToken(token: string): void {
    sessionStorage.setItem(this.VERIFY_TOKEN_KEY, token);
  }

  getVerificationToken(): string | null {
    return sessionStorage.getItem(this.VERIFY_TOKEN_KEY);
  }

  clearVerificationToken(): void {
    sessionStorage.removeItem(this.VERIFY_TOKEN_KEY);
  }

  obtenerPasajerosData(page: number, pageSize: number): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/pasajeros/${page}/${pageSize}`);
  }

  obtenerPasajeros(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/pasajeros/list`);
  }

  obtenerPasajeroClienteId(id: number): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/catpasajero/clientes/${id}`);
  }

  agregarPasajero(data: FormData) {
    return this.http.post(`${environment.API_SECURITY}/pasajeros`, data);
  }

  eliminarPasajero(idPasajero: number) {
    return this.http.delete(`${environment.API_SECURITY}/pasajeros/${idPasajero}`);
  }

  obtenerPasajero(idPasajero: number): Observable<any> {
    return this.http.get<any>(`${environment.API_SECURITY}/pasajeros/${idPasajero}`);
  }

  actualizarPasajero(idPasajero: number, saveForm: any): Observable<any> {
    return this.http.put(`${environment.API_SECURITY}/pasajeros/${idPasajero}`, saveForm);
  }

  updateEstatus(id: number, estatus: number): Observable<string> {
    const url = `${this.apiUrl}/estatus/${id}`;
    const body = { estatus };
    return this.http.patch(url, body, { responseType: 'text' }).pipe(
      catchError(error => throwError(() => error))
    );
  }

  agregarPasajeroAfiliacion(data: any) {
    return this.http.post(
      `${environment.API_SECURITY}/login/pasajero/registro`,
      data,
      { observe: 'response', responseType: 'text' }
    );
  }

  verificarPasajero(codigo: string): Observable<any> {
    const context = new HttpContext().set(SKIP_APP_AUTH, true);

    return this.http.patch(
      `${environment.API_SECURITY}/login/verify`,
      { codigo },
      { responseType: 'text' as 'json', context }
    ).pipe(catchError(err => throwError(() => err)));
  }


  verificarPorCodigo(codigo: string): Observable<string> {
    return this.verificarPasajero(codigo) as unknown as Observable<string>;
  }



  //
  datosUsuarioPasajero(idUsuario: number): Observable<any> {
    return this.http.get<any>(`${environment.API_SECURITY}/pasajeros/main/${idUsuario}`);
  }

  obtenerTipoPasajeroCliente(idCliente: number): Observable<any> {
    return this.http.get<any>(`${environment.API_SECURITY}/catpasajerp/clientes/${idCliente}`);
  }

  updateEstadoSolicitud(idPasajero: number, estadoSolicitud: number, idTipoPasajero: number): Observable<string> {
    const url = `${this.apiUrl}/estado/solicitud/${idPasajero}`;
    const body = { estadoSolicitud, idTipoPasajero };
    return this.http.patch(url, body, { responseType: 'text' }).pipe(
      catchError(error => throwError(() => error))
    );
  }

  obtenerTipoPasajeros(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/catpasajero`);
  }

  obtenerTipoPasajerosList(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/catpasajero/list`);
  }

  obtenerTipoPasajero(id: number): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/catpasajero/${id}`);
  }

  agregarTipoPasajero(data: FormData) {
    return this.http.post(`${environment.API_SECURITY}/catpasajero`, data);
  }

  actualizarTipoPasajero(idPasajero: number, saveForm: any): Observable<any> {
    return this.http.put(`${environment.API_SECURITY}/catpasajero/${idPasajero}`, saveForm);
  }
  
  obtenerTipoDescuento(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/cattipodescuento/list`);
  }
}