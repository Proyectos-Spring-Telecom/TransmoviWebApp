import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {

  constructor(private http: HttpClient) { }

  obtenerUsuarios(): Observable<any> {
    return this.http.get<any>(`${environment.API_SECURITY}/usuarios`);
  }

  agregarUsuario(data: FormData) {
    return this.http.post(environment.API_SECURITY + '/usuarios', data);
  }

  eliminarUsuario(idUsuario: Number) {
		return this.http.delete(environment.API_SECURITY + '/usuarios/' + idUsuario);
	}

  obtenerUsuario(idUsuario: number): Observable<any> {
		return this.http.get<any>(environment.API_SECURITY + '/usuarios/' + idUsuario);
	}

  actualizarUsuario(idUsuario: number, saveForm: any): Observable<any> {
    return this.http.put(`${environment.API_SECURITY}/usuarios/` + idUsuario, saveForm);
  }
  
}