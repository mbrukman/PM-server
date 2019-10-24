import {Component, OnInit} from '@angular/core';

import {Subject} from 'rxjs';
import {BsModalRef} from 'ngx-bootstrap';

import {Group} from '@agents/models';

@Component({
  selector: 'app-agents-group-upsert',
  templateUrl: './agents-group-upsert.component.html',
  styleUrls: ['./agents-group-upsert.component.scss']
})
export class AgentsGroupUpsertComponent implements OnInit {
  group: Group;
  name: string;
  result: Subject<{ name: string }> = new Subject();

  constructor(public bsModalRef: BsModalRef) {
  }

  ngOnInit(): void {

  }

  onConfirm() {
    this.result.next({name: this.name});
    this.bsModalRef.hide();
  }

  onClose() {
    this.bsModalRef.hide();
  }

}
