import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ClientesService {

  constructor(private http: HttpClient) { }

  obtenerClientes(): Observable<any> {
    return this.http.get<any>(`${environment.API_SECURITY}/clientes`);
  }

  agregarCliente(data: FormData) {
    return this.http.post(environment.API_SECURITY + '/clientes', data);
  }

  eliminarCliente(idCliente: Number) {
		return this.http.delete(environment.API_SECURITY + '/clientes/' + idCliente);
	}

  obtenerCliente(idCliente: number): Observable<any> {
		return this.http.get<any>(environment.API_SECURITY + '/clientes/' + idCliente);
	}

  actualizarCliente(idCliente: number, saveForm: any): Observable<any> {
    return this.http.put(`${environment.API_SECURITY}/clientes/` + idCliente, saveForm);
  }
  
}