import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subject } from 'rxjs/Subject';
import { BsModalRef } from 'ngx-bootstrap';

import { AgentsService } from '@agents/agents.service';
import { Agent, Group } from '@agents/models';

@Component({
  selector: 'app-select-groups',
  templateUrl: './select-groups.component.html',
  styleUrls: ['./select-groups.component.scss']
})
export class SelectGroupsComponent implements OnInit, OnDestroy {
  groups: Group[];
  groupsReq: any;
  selectedGroups: Agent[];

  public result: Subject<any> = new Subject();


  constructor(public bsModalRef: BsModalRef, private agentsService: AgentsService) { }

  ngOnInit() {
    this.groupsReq = this.agentsService
      .groupsList()
      .subscribe(groups => {
        this.groups = groups;
      });

  }

  ngOnDestroy() {
    if (this.groupsReq) {
      this.groupsReq.unsubscribe();
    }
  }

  onConfirm(): void {
    this.result.next(this.selectedGroups);
    this.bsModalRef.hide();
  }

  nodeSelect(event) {
    this.selectedGroups.push(event.node.data);
  }

  onClose(): void {
    this.result.next();
    this.bsModalRef.hide();
  }

}
