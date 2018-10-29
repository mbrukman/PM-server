import { AgentsService } from '@agents/agents.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MapsService } from '@maps/maps.service';
import { Map } from '@maps/models/map.model';
import { BsModalService } from 'ngx-bootstrap/modal';
import { BsModalRef } from 'ngx-bootstrap/modal/bs-modal-ref.service';
import 'rxjs/add/observable/timer';
import 'rxjs/add/operator/switchMap';
import { Observable } from 'rxjs/Observable';

import { Subscription } from 'rxjs/Subscription';
import { SelectAgentComponent } from './select-agent/select-agent.component';
import { SelectGroupsComponent } from '@maps/map-detail/map-edit/map-enviroment-pane/map-agents/select-groups/select-groups.component';


@Component({
  selector: 'app-map-agents',
  templateUrl: './map-agents.component.html',
  styleUrls: ['./map-agents.component.scss']
})
export class MapAgentsComponent implements OnInit, OnDestroy {
  map: Map;
  statuses: any;
  mapSubscription: Subscription;
  agentsStatusReq: any;

  constructor(private modalService: BsModalService, private mapsService: MapsService, private agentsService: AgentsService) {
  }

  ngOnInit() {
    this.mapSubscription = this.mapsService.getCurrentMap()
      .subscribe(map => {
        this.map = map;
        this.getAgentsStatus();
      });
  }

  ngOnDestroy() {
    if (this.mapSubscription) {
      this.mapSubscription.unsubscribe();
    }
    if (this.agentsStatusReq) {
      this.agentsStatusReq.unsubscribe();
    }
  }

  getAgentsStatus() {
    this.agentsStatusReq = Observable
      .timer(0, 5000)
      .switchMap(() => this.agentsService.status())
      .subscribe(statuses => {
        this.statuses = statuses;
      });
  }

  openSelectAgentsModal() {
    let modal: BsModalRef;
    modal = this.modalService.show(SelectAgentComponent);
    modal.content.selectedAgents = this.map.agents;
    modal.content.result.subscribe(result => {
      this.map.agents = result;
      this.mapsService.setCurrentMap(this.map);
    });
  }

  openSelectGroupsModal() {
    const modal = this.modalService.show(SelectGroupsComponent);
    modal.content.selectedGroups = this.map.groups;
    modal.content.result
      .take(1)
      .subscribe(result => {
        this.map.groups = result;
        this.mapsService.setCurrentMap(this.map);
      });
  }

}
