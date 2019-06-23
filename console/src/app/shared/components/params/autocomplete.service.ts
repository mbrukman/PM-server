import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {AutoCompleteItem} from '@shared/model/autocomplete.model';


@Injectable()
export class AutoCompleteService {

  constructor(private http: HttpClient) {
  }

  generateAutoCompleteParams(modelName,options) {
    return this.http.get<AutoCompleteItem[]>(`api/autocomplete/${modelName}?query=${options.query}`);
  }
  
  getValueById(id,modelName){
    return this.http.get<AutoCompleteItem>(`api/autocomplete/${modelName}/${id}`);
  }
} 