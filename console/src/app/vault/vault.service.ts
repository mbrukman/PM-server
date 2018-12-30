import { HttpClient } from "@angular/common/http";
import { environment } from '../../environments/environment';
import { Vault } from '../vault/vault.model'
import { Injectable } from "@angular/core";
 
const serverUrl = environment.serverUrl

@Injectable()
export class VaultService {

    constructor(private http: HttpClient) {
    }


    delete(id) {
        return this.http.delete(`${serverUrl}api/vaults/${id}`);
    }

    getAll() {
        return this.http.get<Vault[]>(`${serverUrl}api/vaults`) 
    }

    add(body : Vault){
        return this.http.post(`${serverUrl}api/vaults`,body)
    }

    update(id : string, body : Vault){
        return this.http.put(`${serverUrl}api/vaults/${id}`,body)
    }
}
