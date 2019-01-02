import { HttpClient } from "@angular/common/http";
import { environment } from '../../environments/environment';
import { VaultItem } from '../vault/vault.model'
import { Injectable } from "@angular/core";
 
const serverUrl = environment.serverUrl

@Injectable()
export class VaultService {

    constructor(private http: HttpClient) {
    }
    delete(id) {
        return this.http.delete(`${serverUrl}api/vault/${id}`);
    }

    getResults(options) {
        return this.http.put<VaultItem[]>(`${serverUrl}api/vault`,{options:options})  
    }

    add(body : VaultItem){
        return this.http.post(`${serverUrl}api/vault`,body)
    }

    update(id : string, body : VaultItem){
        return this.http.put(`${serverUrl}api/vault/${id}`,body)
    }
}
