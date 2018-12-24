import { Component } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { BsModalRef } from 'ngx-bootstrap';
import {MapDuplicateOptions} from '@maps/models/map-duplicate-options.model'

@Component({
  selector: 'app-mapduplicate-popup',
  templateUrl: './mapduplicate-popup.component.html',
  styleUrls: ['./mapduplicate-popup.component.scss']
})
export class MapDuplicateComponent {
  optionsPopup:MapDuplicateOptions = new MapDuplicateOptions()
  public result: Subject<MapDuplicateOptions> = new Subject<MapDuplicateOptions>();

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
