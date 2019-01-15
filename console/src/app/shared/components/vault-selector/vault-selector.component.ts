import { Component, OnInit, forwardRef, Input, Output } from '@angular/core';
import { VaultService } from '@shared/vault.service'
import { VaultItem } from 'app/vault/vault.model';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormControl, FormGroup, FormArray } from '@angular/forms';

@Component({
  selector: 'app-vault-selector',
  templateUrl: './vault-selector.component.html',
  styleUrls: ['./vault-selector.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => VaultSelectorComponent),
      multi: true
    }
  ]
})
export class VaultSelectorComponent implements OnInit, ControlValueAccessor {

  results: string[];
  text :string = "";
  @Input() formGroup: FormGroup; 
  options = { query: {}, fields: 'key', limit: 5 }
  propagateChange : (_: any) => { };

  constructor(private vaultService: VaultService) { }

  ngOnInit() {
    this.vaultService.getVaultItems(this.options).subscribe(vaultItems => {
      this.mapResult(vaultItems)
    })
  }

  onSelect(){
    this.formGroup.controls.value = new FormControl(this.text)
    this.propagateChange(this.text);
  }

  mapResult(vaultItems: VaultItem[]) {
    this.results = []
    vaultItems.forEach(item => {
      this.results.push(item.key);
    })
  }

  search(event) {
    this.options.query = event.query;
    this.vaultService.getVaultItems(this.options).subscribe(vaultItems => {
      this.mapResult(vaultItems)
    });
  }

  // interface implementation//
  writeValue(obj: any): void {
    if (obj !== undefined)
      this.text = obj;
  }
  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }
  registerOnTouched(fn: any): void {}


}
