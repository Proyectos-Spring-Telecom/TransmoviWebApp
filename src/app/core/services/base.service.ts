import { Injectable } from '@angular/core';
import { throwError } from 'rxjs';
import { ErrorMessage } from '../../entities/ErrorMessage';

@Injectable({
  providedIn: 'root'
})
export class BaseServicesService {

  constructor() { }
  protected handleError(error: Response | any) {
    const errorMessage: ErrorMessage = new ErrorMessage();
    errorMessage.httpStatus = error.status;
    //console.log(error);
    return throwError(errorMessage);
  }
}
