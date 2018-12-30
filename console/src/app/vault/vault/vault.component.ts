import { Component, OnInit } from '@angular/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap';
import { VaultFormComponent } from '../vault-form/vault-form.component';
import { VaultService } from '../vault.service';
import { Vault } from '../vault.model';

@Component({
  selector: 'app-vault',
  templateUrl: './vault.component.html',
  styleUrls: ['./vault.component.scss']
})
export class VaultComponent implements OnInit {

  vaults: Vault[]
  vaultsReq: any;


  constructor(private vaultService: VaultService, private modalService: BsModalService) { }

  ngOnInit() {
    this.requestVaults();
  }


  requestVaults() {
    this.vaultsReq = this.vaultService.getAll().subscribe(vaults => {
      this.vaults = vaults;
    });
  }

  ngOnDestroy() {
    this.vaultsReq.unsubscribe();
  }

  deleteVault(id) {
    this.vaultService.delete(id).subscribe(() => {
      this.requestVaults();
    });
  }

  onOpenModal(vault: Vault = null) {
    let modal: BsModalRef;
    modal = this.modalService.show(VaultFormComponent);
    if (vault) {
      modal.content.vault = Object.assign({},vault);
    }
    modal.content.result.subscribe(() => {
      this.requestVaults();
    });
  }
}
