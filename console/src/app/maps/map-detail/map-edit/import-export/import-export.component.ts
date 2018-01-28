import { Component, ElementRef, ViewChild } from '@angular/core';

import { Subject } from 'rxjs/Subject';
import { BsModalRef } from 'ngx-bootstrap';

import { MapStructure } from '../../../models/map-structure.model';

@Component({
  selector: 'app-import-export',
  templateUrl: './import-export.component.html',
  styleUrls: ['./import-export.component.scss']
})
export class ImportExportComponent {
  result: Subject<string> = new Subject();
  mapStructure: MapStructure;
  importedStructure: string;
  error: string;
  confirm: boolean = true;
  @ViewChild('copyElm') elm: ElementRef;

  constructor(public bsModalRef: BsModalRef) {
  }

  copyMap() {
    this.elm.nativeElement.select();
    document.execCommand('Copy');
    this.closeModal();
  }

  onCancel() {
    this.result.next();
    this.closeModal();
  }

  onConfirm() {
    if (this.importedStructure) {
      try {
        JSON.parse(this.importedStructure);
      }
      catch (e) {
        this.error = e;
        return;
      }
    }
    let s = Object.assign(JSON.parse(this.importedStructure), {imported: true});
    this.result.next(JSON.stringify(s));
    this.closeModal();
  }

  closeModal() {
    this.bsModalRef.hide();
  }

}
