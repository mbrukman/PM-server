import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { BsModalService } from 'ngx-bootstrap';
import { Subscription } from 'rxjs';

import { MapsService } from '../../maps.service';
import { Map } from '../../models/map.model';
import { MapStructure } from '../../models/map-structure.model';
import { MapDesignService } from './map-design.service';

@Component({
  selector: 'app-map-edit',
  templateUrl: './map-edit.component.html',
  styleUrls: ['./map-edit.component.scss'],
  providers: [MapDesignService]
})
export class MapEditComponent implements OnInit, OnDestroy {
  mapStructure: MapStructure;
  map: Map;
  mapSubscription: Subscription;
  activeTab: any;

  envTabs = [
    {key : 'agents', label: 'Agents', icon: 'icon-agent'},
    {key : 'triggers', label: 'Triggers', icon: 'icon-trigger'},
    {key : 'plugins', label: 'Plugins', icon: 'icon-plugins'}
  ];

  @ViewChild('wrapper') wrapper: ElementRef;


  constructor(private mapsService: MapsService, public designService: MapDesignService, private modalService: BsModalService) {
  }

  ngOnInit() {
    this.mapSubscription = this.mapsService.getCurrentMap().subscribe(map => {
      if (map) {
        this.map = map;
      }
    });

    this.mapsService.getCurrentMapStructure().subscribe(structure => {
      this.mapStructure = structure;
    });
  }

  ngOnDestroy() {
    this.mapSubscription.unsubscribe();
  }

  closeTabs() {
    this.activeTab = null;
    this.designService.tabOpen = false;
  }

  openTab(tab) {
    this.activeTab = tab;
    this.designService.tabOpen = true;
  }

}
