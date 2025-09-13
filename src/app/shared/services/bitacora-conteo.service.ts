import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BlueVoxService {

  constructor(private http: HttpClient) { }

  obtenerBlueVox(): Observable<any> {
    return this.http.get<any>(`${environment.API_SECURITY}/blueVox/conteo`);
  } 

  obtenerBlueVoxFechas(desde:string,hasta:string):Observable<any>{
    return this.http.get<any>(environment.API_SECURITY + '/blueVox/conteo',{params:{
      desde : desde,
      hasta:hasta
    }})
  }
}