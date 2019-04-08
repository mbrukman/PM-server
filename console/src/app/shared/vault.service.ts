import { HttpClient } from "@angular/common/http";
import { environment } from '../../environments/environment';
import { AutoCompleteItem } from '@shared/model/autocomplete.model';
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

    add(item: AutoCompleteItem) {
        return this.http.post<AutoCompleteItem>(`${serverUrl}api/vault`, item)
    }

    update(item: AutoCompleteItem) {
        return this.http.put<AutoCompleteItem>(`${serverUrl}api/vault/${item.id}`, item)
    }

    upsert(item: AutoCompleteItem): Subscribable<AutoCompleteItem> {
        return item.id ? this.update(item) : this.add(item);
    }
}
