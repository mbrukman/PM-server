import { Component, OnInit } from '@angular/core';

import { Subject } from 'rxjs/Subject';
import { BsModalRef } from 'ngx-bootstrap';

import { Group } from '@agents/models';

@Component({
  selector: 'app-edit-group',
  templateUrl: './edit-group.component.html',
  styleUrls: ['./edit-group.component.scss']
})
export class EditGroupComponent implements OnInit {
  group: Group;
  name: string;
  result: Subject<{name: string}> = new Subject();

  constructor(public bsModalRef: BsModalRef) { }

  ngOnInit(): void {

  }

  onConfirm() {
    this.result.next({ name: this.name });
    this.bsModalRef.hide();
  }

  onClose() {
    this.result.next();
    this.bsModalRef.hide();
  }

}
