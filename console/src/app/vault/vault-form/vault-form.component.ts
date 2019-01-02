import { Component, OnInit } from '@angular/core';

import { Subject } from 'rxjs/Subject';
import { BsModalRef } from 'ngx-bootstrap';

import { VaultItem } from '../vault.model';
import { VaultService } from '../../shared/vault.service';
import { Subscribable } from 'rxjs/Observable';

@Component({
  selector: 'app-vault-form',
  templateUrl: './vault-form.component.html',
  styleUrls: ['./vault-form.component.scss']
})
export class VaultFormComponent implements OnInit {

  vault: VaultItem = {
    key: "",
    description: "",
    value: ""
  }
  result: Subject<boolean> = new Subject();
  isRequierd :boolean = false;

  constructor(public bsModalRef: BsModalRef, private vaultService: VaultService) { }

  ngOnInit() {
  }

  onConfirm() {
    let vaultResult: Subscribable<boolean>; 
    if (this.vault.id) {
      vaultResult = this.vaultService.update(this.vault.id, this.vault)
    }
    else {
      vaultResult = this.vaultService.add(this.vault)
    }
    vaultResult.subscribe(() => {
      this.result.next(true);
    },
      (err) => {
        console.log(err);
        this.result.next(false);
      })
    this.bsModalRef.hide();
  }

  onClose() {
    this.result.next();
    this.bsModalRef.hide();
  }

}
