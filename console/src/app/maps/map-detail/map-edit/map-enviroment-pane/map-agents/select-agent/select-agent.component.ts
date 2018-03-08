import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subject } from 'rxjs/Subject';
import { BsModalRef } from 'ngx-bootstrap';

import { AgentsService } from '@agents/agents.service';
import { Agent } from '@agents/models';
import { Observable } from 'rxjs/Observable';

@Component({
  selector: 'app-select-agent',
  templateUrl: './select-agent.component.html',
  styleUrls: ['./select-agent.component.scss']
})
export class SelectAgentComponent implements OnInit, OnDestroy {
  agents: Agent[];
  agentsReq: any;
  selectedAgents: Agent[];

  public result: Subject<any> = new Subject();


  constructor(public bsModalRef: BsModalRef, private agentsService: AgentsService) { }

  ngOnInit() {
    this.agentsReq = this.agentsService
      .list()
      .flatMap(agents => {
        return Observable.forkJoin(
          Observable.of(agents),
          this.agentsService.status()
        )
      })
      .subscribe(data => {
        let [agents, agentsStatus] = data;
        agents.map(agent => Object.assign(agent, { status: agentsStatus[agent.id] }));
        this.agents = agents;
      });

  }

  ngOnDestroy() {
    if (this.agentsReq) {
      this.agentsReq.unsubscribe();
    }
  }

  onConfirm(): void {
    this.result.next(this.selectedAgents);
    this.bsModalRef.hide();
  }

  nodeSelect(event) {
    this.selectedAgents.push(event.node.data);
  }

  onClose(): void {
    this.bsModalRef.hide();
  }

}
