import { Component, OnInit } from '@angular/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap';
import { UpsertVaultItemsComponent } from '../upsert-vault-items/upsert-vault-items.component';
import { VaultService } from '../../shared/vault.service';
import { VaultItem } from '../vault.model';

@Component({
  selector: 'app-vault',
  templateUrl: './vault.component.html',
  styleUrls: ['./vault.component.scss']
})
export class VaultComponent implements OnInit {

  vaultItems: VaultItem[]
  vaultsReq: any;


  constructor(private vaultService: VaultService, private modalService: BsModalService) { }

  ngOnInit() {
    this.requestVaults();
  }


  requestVaults() {
    this.vaultsReq = this.vaultService.getVaultItems({}).subscribe(vault => {
      this.vaultItems = vault;
    });
  }

  ngOnDestroy() {
    this.vaultsReq.unsubscribe();
  }

  deleteVaultItem(id) {
    this.vaultService.delete(id).subscribe(() => {
      this.requestVaults();
    });
  }

  upsertItem(item: VaultItem = null) {
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
