import { Component, OnInit } from '@angular/core';

import { Subject } from 'rxjs/Subject';
import { BsModalRef } from 'ngx-bootstrap';

import { Agent } from '@agents/models';

@Component({
  selector: 'app-edit-agent',
  templateUrl: './edit-agent.component.html',
  styleUrls: ['./edit-agent.component.scss']
})
export class EditAgentComponent implements OnInit {
  agent: Agent;
  name: string;
  attributes: any[];
  result: Subject<{ name: string, attributes: string[] }> = new Subject();

  constructor(public bsModalRef: BsModalRef) { }

  ngOnInit(): void {

  }

  onConfirm() {
    const attributes = this.attributes.map(o => {
      if (typeof (o) === 'string') {
        return o;
      }
      return o.value;
    });
    this.result.next({ name: this.name, attributes });
    this.bsModalRef.hide();
  }

  onClose() {
    this.result.next();
    this.bsModalRef.hide();
  }

}
