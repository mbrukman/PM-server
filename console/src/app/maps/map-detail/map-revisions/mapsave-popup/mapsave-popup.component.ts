import { Component } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { BsModalRef } from 'ngx-bootstrap';

@Component({
  selector: 'app-mapsave-popup',
  templateUrl: './mapsave-popup.component.html',
  styleUrls: ['./mapsave-popup.component.scss']
})
export class MapSavePopupComponent {
  name: string;
  isChecked:boolean
  public result: Subject<{name:string,ischecked:boolean}> = new Subject<{name:string,ischecked:boolean}>();

  constructor(public bsModalRef: BsModalRef) {
  }

  onClose() {
    this.bsModalRef.hide();
  }

  onConfirm() {
    this.result.next({name:this.name,ischecked:this.isChecked });
    this.onClose();
  }

}
