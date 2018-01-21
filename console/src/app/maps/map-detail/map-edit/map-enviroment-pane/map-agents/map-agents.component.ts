import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from "rxjs/Subscription";
import { BsModalService } from 'ngx-bootstrap/modal';
import { BsModalRef } from 'ngx-bootstrap/modal/bs-modal-ref.service';

import { MapsService } from "../../../../maps.service";
import { Map } from "../../../../models/map.model";
import { AgentsService } from "../../../../../agents/agents.service";
import { SelectAgentComponent } from "./select-agent/select-agent.component";



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
    this.mapSubscription = this.mapsService.getCurrentMap().subscribe(map => {
      this.map = map;
      this.getAgentsStatus();
    });
  }

  ngOnDestroy() {
    this.mapSubscription.unsubscribe();
  }

  getAgentsStatus() {
    this.agentsStatusReq = this.agentsService.status().subscribe(statuses => {
      this.statuses = statuses;
    })
  }

  openSelectAgentsModal() {
    let modal: BsModalRef;
    modal = this.modalService.show(SelectAgentComponent);
    modal.content.selectedAgents = this.map.agents;
    modal.content.result.subscribe(result => {
      this.map.agents = result;
      this.mapsService.setCurrentMap(this.map);
    })

  }

}
