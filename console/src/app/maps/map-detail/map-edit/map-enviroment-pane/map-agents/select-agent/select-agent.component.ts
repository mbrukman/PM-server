import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subject, of, forkJoin } from 'rxjs';
import { BsModalRef } from 'ngx-bootstrap';

import { AgentsService } from '@agents/agents.service';
import { Agent, Group } from '@agents/models';
import { Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

@Component({
  selector: 'app-select-agent',
  templateUrl: './select-agent.component.html',
  styleUrls: ['./select-agent.component.scss']
})
export class SelectAgentComponent implements OnInit, OnDestroy {
  agents: Agent[];
  groups: Group[];
  agentsReq: any;
  groupsReq: any;
  selectedGroups: Agent[];
  selectedAgents: Agent[];

  public result: Subject<any> = new Subject();
  isAgentTab: boolean = true;


  constructor(public bsModalRef: BsModalRef, private agentsService: AgentsService) { }

  ngOnInit() {
    this.agentsReq = this.agentsService
      .list().pipe(
        mergeMap(agents => {
          return forkJoin(
            of(agents),
            this.agentsService.status()
          );
        })
      ).subscribe(data => {
        let [agents, agentsStatus] = data;
        agents.map(agent => Object.assign(agent, { status: agentsStatus[agent.id] }));
        this.agents = agents;
      });

    this.groupsReq = this.agentsService
      .groupsList()
      .subscribe(groups => {
        this.groups = groups;
      });

  }


  ngOnDestroy() {
    this.agentsReq ? this.agentsReq.unsubscribe() : null;
    this.groupsReq ? this.groupsReq.unsubscribe() : null;
  }

  onConfirm(): void {
    let res = { agents: this.selectedAgents, groups: this.selectedGroups }
    this.result.next(res);
    this.onClose();
  }

  nodeSelect(event) {
    this.isAgentTab ? this.selectedAgents.push(event.node.data) : this.selectedGroups.push(event.node.data);
  }

  onClose(): void {
    this.bsModalRef.hide();
  }

}
