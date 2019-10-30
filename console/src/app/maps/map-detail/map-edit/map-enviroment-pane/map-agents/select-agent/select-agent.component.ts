import {Component, OnDestroy, OnInit} from '@angular/core';

import {Subject, of, forkJoin, Subscription} from 'rxjs';
import {BsModalRef} from 'ngx-bootstrap';

import {AgentsService} from '@app/services/agent/agents.service';
import {Group} from '@agents/models';
import {mergeMap} from 'rxjs/operators';
import {Agent} from '@app/services/agent/agent.model';

@Component({
  selector: 'app-select-agent',
  templateUrl: './select-agent.component.html',
  styleUrls: ['./select-agent.component.scss']
})
export class SelectAgentComponent implements OnInit, OnDestroy {
  agents: Agent[];
  groups: Group[];
  selectedGroups: Agent[];
  selectedAgents: Agent[];

  public result: Subject<any> = new Subject();
  isAgentTab: boolean = true;

  private mainSubscription = new Subscription();

  constructor(
    public bsModalRef: BsModalRef,
    private agentsService: AgentsService
  ) {
  }

  ngOnInit() {
    const listAgentsSubscription = this.agentsService.list().pipe(
      mergeMap(agents => {
        return forkJoin(
          of(agents),
          this.agentsService.status()
        );
      })
    ).subscribe(data => {
      let [agents, agentsStatus] = data;
      agents.map(agent => Object.assign(agent, {status: agentsStatus[agent.id]}));
      this.agents = agents;
    });

    const listGroupSubscription = this.agentsService.groupsList().subscribe(groups => {
      this.groups = groups;
    });

    this.mainSubscription.add(listAgentsSubscription);
    this.mainSubscription.add(listGroupSubscription);
  }

  onConfirm(): void {
    let res = {agents: this.selectedAgents, groups: this.selectedGroups};
    this.result.next(res);
    this.onClose();
  }

  onClose(): void {
    this.bsModalRef.hide();
  }

  ngOnDestroy(): void {
    this.mainSubscription.unsubscribe();
  }

}
