import { HttpClient } from "@angular/common/http";
import { VaultItem } from '../vault/vault.model';
import { Injectable } from "@angular/core";
import { Subscribable } from "rxjs";


@Injectable({providedIn: 'root'})
export class VaultService {

    constructor(private http: HttpClient) {
    }
    delete(id) {
        return this.http.delete<boolean>(`api/vault/${id}`);
    }

    getVaultItems() {
        return this.http.get<VaultItem[]>(`api/vault`)
    }

    add(item: VaultItem) {
        return this.http.post<VaultItem>(`api/vault`, item)
    }

    update(item: VaultItem) {
        return this.http.put<VaultItem>(`api/vault/${item.id}`, item)
    }

    upsert(item: VaultItem): Subscribable<VaultItem> {
        return item.id ? this.update(item) : this.add(item);
    }
}
