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
  third: string;
  message: string = 'Are you sure?';

  public result: Subject<boolean> = new Subject();

  constructor(public bsModalRef: BsModalRef) {
  }

  onAction(action) {
    this.result.next(action);
    this.closeModal();
  }

  closeModal() {
    this.bsModalRef.hide();

  }

}
