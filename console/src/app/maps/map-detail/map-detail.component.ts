import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

import { Subscription } from 'rxjs/Subscription';
import * as _ from 'lodash';
import { BsModalService } from 'ngx-bootstrap/modal';

import { MapsService } from '../maps.service';
import { Map } from '../models/map.model';
import { MapStructure } from '../models/map-structure.model';
import { ConfirmComponent } from '../../shared/confirm/confirm.component';
import { SocketService } from '../../shared/socket.service';


@Component({
  selector: 'app-map-detail',
  templateUrl: './map-detail.component.html',
  styleUrls: ['./map-detail.component.scss']
})
export class MapDetailComponent implements OnInit, OnDestroy {
  id: string;
  originalMap: Map;
  map: Map;
  routeReq: any;
  mapReq: any;
  mapExecReq: any;
  mapStructure: MapStructure;
  mapStructureReq: any;
  mapStructuresListReq: any;
  structuresList: MapStructure[] = [];
  structureIndex: number;
  originalMapStructure: MapStructure;
  mapStructureSubscription: Subscription;
  edited: boolean = false;
  structureEdited: boolean = false;
  initiated: boolean = false;
  mapExecutionSubscription: Subscription;
  executing: boolean;
  downloadJson: SafeUrl;

  constructor(private route: ActivatedRoute,
              private router: Router,
              private sanitizer: DomSanitizer,
              private mapsService: MapsService,
              private socketService: SocketService,
              private modalService: BsModalService) {
  }

  ngOnInit() {
    this.routeReq = this.route.params.subscribe(params => {
      this.id = params['id'];
      this.mapReq = this.mapsService.getMap(this.id).subscribe(map => {
        if (!map) {
          this.router.navigate(['NotFound']);
        }
        this.map = map;
        this.originalMap = _.cloneDeep(map);
        this.mapsService.setCurrentMap(map);
        this.mapStructuresListReq = this.mapsService.structuresList(this.id).subscribe(structureList => {
          this.structuresList = structureList;
        });
        this.mapStructureReq = this.mapsService.getMapStructure(this.id).subscribe(structure => {

          if (structure === null) {
            structure = new MapStructure();
            structure.map = params['id'];
          }
          this.mapsService.setCurrentMapStructure(structure);
        }, error => {
          // if there is an error, return a new map structure
          let structure = new MapStructure();
          structure.map = params['id'];
          this.mapsService.setCurrentMapStructure(structure);
          console.log('Error getting map structure', error);
        });
      }, () => {
        console.log('Couldn\'t get map model');
        this.router.navigate(['NotFound']);
      });
    });
    this.mapsService.getCurrentMap().subscribe(map => {
      if (map) {
        this.map = map;
        this.originalMap.archived = map.archived;
        if (!_.isEqual(map, this.originalMap)) {
          this.edited = true;
        } else {
          this.edited = false;
        }
      }
    });
    this.mapStructureSubscription = this.mapsService.getCurrentMapStructure().subscribe(structure => {
      if (!structure) {
        return;
      }
      if (!this.initiated) {
        this.originalMapStructure = _.cloneDeep(structure);
      }
      if (this.initiated && !_.isEqual(structure, this.originalMapStructure)) {
        this.structureEdited = true;
      } else {
        this.structureEdited = false;
      }
      this.mapStructure = structure;
      this.initiated = true;
      this.structureIndex = this.structuresList.length - this.structuresList.findIndex((o) => {
        return o.id === structure.id;
      });
      this.generateDownloadJsonUri();
    });
    this.mapExecutionSubscription = this.socketService.getCurrentExecutionsAsObservable().subscribe(executions => {
      const maps = Object.keys(executions).map(key => executions[key]);
      this.executing = maps.indexOf(this.id) > -1;
    });
  }

  ngOnDestroy() {
    this.routeReq.unsubscribe();
    this.mapReq.unsubscribe();
    if (this.mapStructureReq) {
      this.mapStructureReq.unsubscribe();
    }
    if (this.mapExecReq) {
      this.mapExecReq.unsubscribe();
    }
    this.mapsService.clearCurrentMap();
    this.mapsService.clearCurrentMapStructure();
    this.mapExecutionSubscription.unsubscribe();
  }

  generateDownloadJsonUri() {
    let structure = Object.assign({}, this.mapStructure);
    delete structure._id;
    delete structure.id;
    delete structure.map;
    delete structure.map;
    delete structure._id;
    delete structure.id;
    if (structure.used_plugins) {
      structure.used_plugins.forEach(plugin => {
        delete plugin._id
      });
    }
    structure.processes.forEach((process, i) => {
      delete structure.processes[i]._id;
      delete structure.processes[i].plugin;
      delete structure.processes[i].used_plugin._id;
      delete structure.processes[i].createdAt;
      delete structure.createdAt;
      delete structure.updatedAt;
      if (process.actions) {
        process.actions.forEach((action, j) => {
          delete structure.processes[i].actions[j]._id;
          delete structure.processes[i].actions[j].id;
        });
      }
    });
    structure.links.forEach((link, i) => {
      delete structure.links[i]._id;
      delete structure.links[i].createdAt;
    });

    this.downloadJson = this.sanitizer.bypassSecurityTrustUrl('data:text/json;charset=UTF-8,' + encodeURIComponent(JSON.stringify(structure)));
  }

  discardChanges() {
    this.mapsService.setCurrentMapStructure(this.originalMapStructure);
  }

  executeMap() {
    this.mapExecReq = this.mapsService.execute(this.id).subscribe();
  }

  saveMap() {
    if (this.edited) {
      this.mapsService.updateMap(this.map.id, this.map).subscribe(() => {
        this.originalMap = _.cloneDeep(this.map);
        this.edited = false;
      }, error => {
        console.log(error);
      });
    }
    if (this.structureEdited) {
      delete this.mapStructure._id;
      delete this.mapStructure.id;
      delete this.mapStructure.createdAt;
      this.mapsService.createMapStructure(this.map.id, this.mapStructure).subscribe((structure) => {
        this.originalMapStructure = Object.assign({}, this.mapStructure);
        this.structureEdited = false;
        this.structuresList.unshift(structure);
        this.mapStructure.id = structure.id;
      }, error => {
        console.log('Error saving map', error);
      });
    }

  }

  canDeactivate() {
    // will be triggered by deactivate guard
    if (this.edited || this.structureEdited) {
      let modal = this.modalService.show(ConfirmComponent);
      modal.content.message = 'You have unsaved changes that will be lost by this action. Discard changes?';
      return modal.content.result.asObservable();
    }
    return true;
  }

}
