import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { BsModalService } from 'ngx-bootstrap';
import { Subscription } from 'rxjs/Subscription';

import { MapsService } from '../../maps.service';
import { Map } from '../../models/map.model';
import { MapStructure } from '../../models/map-structure.model';
import { MapDesignService } from './map-design.service';
import { ImportExportComponent } from './import-export/import-export.component';

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
  mapStructureSubscription: Subscription;
  tab: string;
  @ViewChild('wrapper') wrapper: ElementRef;

  constructor(private mapsService: MapsService, private modalService: BsModalService) {
  }

  ngOnInit() {
    this.mapSubscription = this.mapsService.getCurrentMap().subscribe(map => {
      if (map) {
        this.map = map;
      }
    });

    this.mapStructureSubscription = this.mapsService.getCurrentMapStructure().subscribe(structure => {
      this.mapStructure = structure;
    });
  }

  ngOnDestroy() {
    this.mapSubscription.unsubscribe();
    this.mapStructureSubscription.unsubscribe();

  }

  openImportExportModal() {
    let structure = Object.assign({}, this.mapStructure);
    structure = this.removePrivateFields(structure);
    const modal = this.modalService.show(ImportExportComponent);
    modal.content.mapStructure = JSON.stringify(structure);
    modal.content.result
      .take(1)
      .filter(result => result)
      .subscribe(result => {
        this.mapsService.setCurrentMapStructure(JSON.parse(result))
      });
  }

  removePrivateFields(structure) {
    delete structure.map;
    delete structure._id;
    delete structure.id;

    structure.processes.forEach((process, i) => {
      delete structure.processes[i]._id;
      delete structure.processes[i].plugin;
      delete structure.processes[i].createdAt;
      delete structure.createdAt;

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

    return structure;

  }

}
