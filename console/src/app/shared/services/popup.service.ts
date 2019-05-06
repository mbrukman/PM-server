import { Injectable } from '@angular/core';
import { ConfirmComponent } from '@shared/confirm/confirm.component';
import { BsModalService } from 'ngx-bootstrap';



@Injectable()
export class PopupService {

    
  constructor(private modalService: BsModalService,) {
  }

  openConfirm(title,message,confirmText,cancelText,thirdButtonText){
      const modal = this.modalService.show(ConfirmComponent);
      modal.content.message = message;
      modal.content.confirm = confirmText;
      modal.content.cancel = cancelText || 'Cancel';
      modal.content.third = thirdButtonText;
      modal.content.title = title;
      return modal.content.result
  }
}