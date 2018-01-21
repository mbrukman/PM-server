import { Component, OnInit, OnDestroy } from '@angular/core';
import { AgentsService } from '../../../../../../agents/agents.service';

import { BsModalRef } from 'ngx-bootstrap';
import { TreeNode } from 'primeng/primeng';

import { Agent } from '../../../../../../agents/models/agent.model';
import { Subject } from 'rxjs/Subject';

@Component({
  selector: 'app-select-agent',
  templateUrl: './select-agent.component.html',
  styleUrls: ['./select-agent.component.scss']
})
export class SelectAgentComponent implements OnInit, OnDestroy {
  agents: Agent[];
  agentsReq: any;
  selectedAgents: Agent[];
  statusReq: any;

  public result: Subject<any> = new Subject();


  constructor(public bsModalRef: BsModalRef, private agentsService: AgentsService) {
  }

  ngOnInit() {
    this.agentsReq = this.agentsService.list().subscribe(agents => {
      this.statusReq = this.agentsService.status().subscribe(agentsStatus => {
        console.log(agentsStatus);
        agents.map(agent => Object.assign(agent, { status: agentsStatus[agent.key] }));
        this.agents = agents;
        console.log(this.agents);
      });
    });


  }

  ngOnDestroy() {
    this.agentsReq.unsubscribe();
    if (this.statusReq) {
      this.statusReq.unsubscribe();
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
