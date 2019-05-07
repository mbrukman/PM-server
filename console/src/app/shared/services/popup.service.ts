import { Injectable } from '@angular/core';
import { ConfirmComponent } from '@shared/confirm/confirm.component';
import { BsModalService } from 'ngx-bootstrap';



@Injectable()
export class PopupService {

    
  constructor(private modalService: BsModalService) {
  }

  openComponent(component,content){
    const modal = this.modalService.show(component);
    Object.keys(content).forEach(key => {
      modal.content[key] = content[key];
    })
    return modal.content.result;
  }

  openConfirm(title,message,confirmText,cancelText,thirdButtonText){
      let content = {
        message:message,
        confirm:confirmText,
        title:title,
        third:thirdButtonText,
        cancel:cancelText || 'Cancel'
      }
      return this.openComponent(ConfirmComponent,content);
  }
}