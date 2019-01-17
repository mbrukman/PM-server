import { Component, OnInit } from '@angular/core';

import { Subject } from 'rxjs/Subject';
import { BsModalRef } from 'ngx-bootstrap';

import { VaultItem } from '../vault.model';
import { VaultService } from '../../shared/vault.service';
import { Subscribable } from 'rxjs/Observable';

@Component({
  selector: 'app-upsert-vault-items',
  templateUrl: './upsert-vault-items.component.html',
  styleUrls: ['./upsert-vault-items.component.scss']
})
export class UpsertVaultItemsComponent implements OnInit {

  vault : VaultItem =  new VaultItem();
 
  result: Subject<boolean> = new Subject();
  isRequierd :boolean = false;

  constructor(public bsModalRef: BsModalRef, private vaultService: VaultService) { }

  ngOnInit() {
  }

  onConfirm() {
    this.vaultService.upsert(this.vault).subscribe(() => {
      this.result.next(true);
      this.onClose();
    },(err) => {
      console.log(err);
      this.result.next(false);
      this.onClose();
    })
  }

  onClose() {
    this.bsModalRef.hide();
  }

}
