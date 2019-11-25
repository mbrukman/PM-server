import { Component, OnInit, OnDestroy } from '@angular/core';
import { UpsertVaultItemsComponent } from '../upsert-vault-items/upsert-vault-items.component';
import { VaultService } from '../../shared/vault.service';
import { AutoCompleteItem } from '@shared/model/autocomplete.model';
import {VaultItem} from '../vault.model';
import {SeoService,PageTitleTypes} from '@app/seo.service';
import {PopupService} from '@shared/services/popup.service';
import { filter, switchMap } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-vault',
  templateUrl: './vault.component.html',
  styleUrls: ['./vault.component.scss']
})
export class VaultComponent implements OnInit, OnDestroy {

  vaultItems: VaultItem[];
  private mainSubscription = new Subscription();


  constructor(private vaultService: VaultService, private popupService:PopupService,
    private seoService:SeoService) { }

  ngOnInit() {
    this.seoService.setTitle(PageTitleTypes.Vault)
    this.requestVaults();
  }

  ngOnDestroy(){
    this.mainSubscription.unsubscribe();
  }

  requestVaults() {
    this.vaultService.getVaultItems().subscribe(vault => {
      this.vaultItems = vault;
    });
  }

  deleteVaultItem(id: string, item: VaultItem) {
    const confirm = 'Yes';
    const popupSubscription = this.popupService.openConfirm(
      `Delete ${item.key}`,
      `Are you sure you want to delete ${item.key} from the vault?`,
      confirm,
      'No',
      null
    ).pipe(
        filter(ans => ans === confirm),
        switchMap(() => this.vaultService.delete(id))
      )
      .subscribe(ans => {
        this.requestVaults();
      });

    this.mainSubscription.add(popupSubscription);
  }

  upsertItem(item: AutoCompleteItem = null) {
    let content;
    if (item) {
      content = {vault : Object.assign({},item)};
    }
    this.popupService.openComponent(UpsertVaultItemsComponent, content || {})
    .subscribe(() => {
      this.requestVaults();
    });
  }
}
