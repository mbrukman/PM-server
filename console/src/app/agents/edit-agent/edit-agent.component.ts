import {Component} from '@angular/core';

import {Subject} from 'rxjs';
import {BsModalRef} from 'ngx-bootstrap';
import {Agent} from '@app/services/agent/agent.model';

@Component({
  selector: 'app-edit-agent',
  templateUrl: './edit-agent.component.html',
  styleUrls: ['./edit-agent.component.scss']
})
export class EditAgentComponent {
  agent: Agent;
  name: string;
  tag: string = '';
  attributes: string[] = [];
  result: Subject<{ name: string, attributes: string[] }> = new Subject();

  constructor(public bsModalRef: BsModalRef) {
  }

  saveTag() {
    this.attributes.push(this.tag);
    this.tag = '';
  }

  deleteTag(tagIndex) {
    this.attributes.splice(tagIndex, 1);
  }

  onConfirm() {
    const attributes = this.attributes.map(attribute => {
      if (typeof (attribute) === 'string') {
        return attribute;
      }
    });
    this.result.next({name: this.name, attributes});
    this.onClose();
  }

  onClose() {
    this.bsModalRef.hide();
  }

}
