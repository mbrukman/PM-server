import { Component, OnInit } from '@angular/core';
import { Subject } from 'rxjs/Subject';

import { BsModalRef } from 'ngx-bootstrap';

@Component({
  selector: 'app-confirm',
  templateUrl: './confirm.component.html',
  styleUrls: ['./confirm.component.scss']
})
export class ConfirmComponent {
  title: string = '';
  confirm: string = 'Yes';
  cancel: string = 'Cancel';
  message: string = 'Are you sure?';

  public result: Subject<boolean> = new Subject();

  constructor(public bsModalRef: BsModalRef) {
  }

  onCancel() {
    this.result.next(false);
    this.closeModal();
  }

  onConfirm() {
    this.result.next(true);
    this.closeModal();
  }

  closeModal() {
    this.bsModalRef.hide();

  }

}
