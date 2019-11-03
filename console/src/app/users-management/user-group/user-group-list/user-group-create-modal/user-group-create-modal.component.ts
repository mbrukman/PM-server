import {Component} from '@angular/core';
import {BsModalRef} from 'ngx-bootstrap';
import {Subject} from 'rxjs';
import UserGroupDataInterface from '@app/services/user-group/user-group-data.interface';
import {FormControl, FormGroup, Validators} from '@angular/forms';

@Component({
  selector: 'app-user-group-create-modal',
  templateUrl: './user-group-create-modal.component.html',
  styleUrls: ['./user-group-create-modal.component.scss']
})
export class UserGroupCreateModalComponent {
  edit: boolean = false;

  public userGroupForm = new FormGroup({
    name: new FormControl('', [Validators.required]),
    description: new FormControl()
  });

  public onClose = new Subject<UserGroupDataInterface>();

  constructor(public bsModalRef: BsModalRef) {
  }
  onCreateGroup() {
    this.onClose.next(this.userGroupForm.value);
    this.bsModalRef.hide();
  }
}
