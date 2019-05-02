import { Component, OnInit } from '@angular/core';

import { Subject, of, forkJoin } from 'rxjs';
import { BsModalRef } from 'ngx-bootstrap';

import { AgentsService } from '@agents/agents.service';
import { Agent, Group } from '@agents/models';
import { mergeMap } from 'rxjs/operators';

@Component({
  selector: 'app-select-agent',
  templateUrl: './select-agent.component.html',
  styleUrls: ['./select-agent.component.scss']
})
export class SelectAgentComponent implements OnInit {
  agents: Agent[];
  groups: Group[];
  selectedGroups: Agent[];
  selectedAgents: Agent[];

  public result: Subject<any> = new Subject();
  isAgentTab: boolean = true;


  constructor(public bsModalRef: BsModalRef, private agentsService: AgentsService) { }

  ngOnInit() {
    this.agentsService.list().pipe(
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

    this.agentsService.groupsList().subscribe(groups => {
        this.groups = groups;
    });

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
