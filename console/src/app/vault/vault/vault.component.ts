import { Component, OnInit } from '@angular/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap';
import { UpsertVaultItemsComponent } from '../upsert-vault-items/upsert-vault-items.component';
import { VaultService } from '../../shared/vault.service';
import { AutoCompleteItem } from '@shared/model/autocomplete.model';
import {VaultItem} from '../vault.model';
import {SeoService,PageTitleTypes} from '@app/seo.service';

@Component({
  selector: 'app-vault',
  templateUrl: './vault.component.html',
  styleUrls: ['./vault.component.scss']
})
export class VaultComponent implements OnInit {

  vaultItems: VaultItem[]

  constructor(private vaultService: VaultService, private modalService: BsModalService,
    private seoService:SeoService) { }

  ngOnInit() {
    this.seoService.setTitle(PageTitleTypes.Vault)
    this.requestVaults();
  }


  requestVaults() {
    this.vaultService.getVaultItems().subscribe(vault => {
      this.vaultItems = vault;
    });
  }

  deleteVaultItem(id) {
    this.vaultService.delete(id).subscribe(() => {
      this.requestVaults();
    });
  }

  upsertItem(item: AutoCompleteItem = null) {
    let modal: BsModalRef;
    modal = this.modalService.show(UpsertVaultItemsComponent);
    if (item) {
      modal.content.vault = Object.assign({},item);
    }
    modal.content.result.subscribe(() => {
      this.requestVaults();
    });
  }
}
