import { Component } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { BsModalRef } from 'ngx-bootstrap';
import {MapPopup} from '@maps/models/map-popup.model'

@Component({
  selector: 'app-mapduplicate-popup',
  templateUrl: './mapduplicate-popup.component.html',
  styleUrls: ['./mapduplicate-popup.component.scss']
})
export class MapDuplicateComponent {
  optionsPopup:MapPopup = new MapPopup()
  public result: Subject<MapPopup> = new Subject<MapPopup>();

  constructor(public bsModalRef: BsModalRef) {
  }

  onClose() {
    this.bsModalRef.hide();
  }

  onConfirm() {
    this.result.next(this.optionsPopup);
    this.onClose();
  }

}
