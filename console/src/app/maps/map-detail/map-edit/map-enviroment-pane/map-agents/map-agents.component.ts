import {Component, OnInit, OnDestroy} from '@angular/core';
import {timer, Subscription} from 'rxjs';

import {AgentsService} from '@app/services/agent/agents.service';
import {MapsService} from '@app/services/map/maps.service';
import {Map} from '@app/services/map/models/map.model';

import {PopupService} from '@shared/services/popup.service';

import {SelectAgentComponent} from './select-agent/select-agent.component';
import {switchMap} from 'rxjs/operators';


@Component({
  selector: 'app-map-agents',
  templateUrl: './map-agents.component.html',
  styleUrls: ['./map-agents.component.scss']
})
export class MapAgentsComponent implements OnInit, OnDestroy {
  map: Map;
  statuses: any;
  private mainSubscription = new Subscription();

  constructor(
    private popupService: PopupService,
    private mapsService: MapsService,
    private agentsService: AgentsService
  ) {
  }

  ngOnInit() {
    const currentMapSubscription = this.mapsService.getCurrentMap()
      .subscribe(map => {
        this.map = map;
        this.getAgentsStatus();
      });

    this.mainSubscription.add(currentMapSubscription);
  }

  getAgentsStatus() {
    const agentStatusSubscription = timer(0, 5000).pipe(
      switchMap(() => this.agentsService.status())
    ).subscribe(statuses => {
      this.statuses = statuses;
    });
    this.mainSubscription.add(agentStatusSubscription);
  }

  openSelectAgentsModal() {
    const openSelectSubscription = this.popupService.openComponent(SelectAgentComponent, {
      selectedAgents: this.map.agents,
      selectedGroups: this.map.groups
    })
      .subscribe(result => {
        this.map.agents = result.agents;
        this.map.groups = result.groups;
        this.mapsService.setCurrentMap(this.map);
      });

    this.mainSubscription.add(openSelectSubscription);
  }

  ngOnDestroy() {
    this.mainSubscription.unsubscribe();
  }
}
