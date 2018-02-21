import { Component, OnInit } from '@angular/core';

import { Subscription } from 'rxjs/Subscription';
import { BsModalService } from 'ngx-bootstrap';

import { AddConfigurationComponent } from './add-configuration/add-configuration.component';
import { MapsService } from '@maps/maps.service';
import { MapStructure } from '@maps/models';

@Component({
  selector: 'app-map-configurations',
  templateUrl: './map-configurations.component.html',
  styleUrls: ['./map-configurations.component.scss']
})
export class MapConfigurationsComponent implements OnInit {
  mapStructureSubscription: Subscription;
  mapStructure: MapStructure;

  constructor(private modalService: BsModalService, private mapsService: MapsService) { }

  ngOnInit() {
    this.mapStructureSubscription = this.mapsService
      .getCurrentMapStructure()
      .subscribe(structure => {
        this.mapStructure = structure;
      });
  }

  /**
   * Open configuration modal. If index is passed it will pass the configuration to the modal to edit
   * @param index
   */
  openAddConfigurationModal(index?) {
    const configuration = index !== undefined ? this.mapStructure.configurations[index] : null;
    const takenNames = this.mapStructure.configurations ? this.mapStructure.configurations
      .reduce((total, current, i) => {
        if (index !== i) {
          total.push(current.name);
        }
        return total;
      }, []) : [];
    const modal = this.modalService.show(AddConfigurationComponent);
    modal.content.configuration = configuration;
    modal.content.forbiddenNames = takenNames;
    modal.content.result
      .take(1)
      .filter(config => !!config)
      .subscribe(config => {
        if (index || index === 0) {
          this.mapStructure.configurations[index] = config;
        } else {
          this.mapStructure.configurations.push(config);
        }
        this.mapsService.setCurrentMapStructure(this.mapStructure);

      });
  }

  removeConfiguration(index) {
    this.mapStructure.configurations.splice(index, 1);
    this.mapsService.setCurrentMapStructure(this.mapStructure);
  }

}
