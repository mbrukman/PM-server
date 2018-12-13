import { Component } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal/bs-modal-ref.service';

@Component({
  selector: 'app-plugindeleted-popup',
  templateUrl: './plugindeleted-popup.component.html',
  styleUrls: ['./plugindeleted-popup.component.scss']
})
export class PluginDeletedComponent {

    pluginName:string;
    constructor(public bsModalRef: BsModalRef) {
  }
    onClose() {
        
        this.bsModalRef.hide();
  }
}