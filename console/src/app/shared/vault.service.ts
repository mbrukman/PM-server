import { HttpClient } from "@angular/common/http";
import { environment } from '../../environments/environment';
import { AutoCompleteItem } from '@shared/model/autocomplete.model';
import { VaultItem } from '../vault/vault.model';
import { Injectable } from "@angular/core";
import { Subscribable } from "rxjs";

const serverUrl = environment.serverUrl

@Injectable()
export class VaultService {

    constructor(private http: HttpClient) {
    }
    delete(id) {
        return this.http.delete<boolean>(`${serverUrl}api/vault/${id}`);
    }

    getVaultItems(options) {
        return this.http.put<AutoCompleteItem[]>(`${serverUrl}api/vault`, { options: options })
    }

    add(item: VaultItem) {
        return this.http.post<VaultItem>(`${serverUrl}api/vault`, item)
    }

    update(item: VaultItem) {
        return this.http.put<VaultItem>(`${serverUrl}api/vault/${item.id}`, item)
    }

    upsert(item: VaultItem): Subscribable<VaultItem> {
        return item.id ? this.update(item) : this.add(item);
    }
}
