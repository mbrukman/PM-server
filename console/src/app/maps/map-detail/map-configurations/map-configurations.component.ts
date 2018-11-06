import { Component, OnInit } from '@angular/core';
import { BsModalService } from 'ngx-bootstrap';

import { MapStructureConfiguration, MapStructure } from '@maps/models';
import { MapsService } from '@maps/maps.service';
import { AddConfigurationComponent } from '@maps/map-detail/map-configurations/add-configuration/add-configuration.component';

@Component({
  selector: 'app-main-map-configurations',
  templateUrl: './map-configurations.component.html',
  styleUrls: ['./map-configurations.component.scss']
})
export class MapConfigurationsComponent implements OnInit {
  selectedConfiguration: MapStructureConfiguration;
  mapStructure: MapStructure;
  editorOptions = {
    theme: 'vs-dark',
    language: 'json'
  };
  value: string = '';

  constructor(private mapsService: MapsService, private modalService: BsModalService) { }

  ngOnInit() {
    this.mapsService.getCurrentMapStructure()
      .filter(structure => !!structure)
      .subscribe(structure => {
        this.mapStructure = structure;
        if (!this.selectedConfiguration && structure.hasOwnProperty('configurations') && structure.configurations.length) {
          this.editConfiguration(0);
        }
      });
  }

  addNewConfiguration() {
    const modalRef = this.modalService.show(AddConfigurationComponent);
    modalRef.content.result
      .take(1)
      .filter(name => !!name)
      .subscribe(name => {
        this.mapStructure.configurations.push(new MapStructureConfiguration(name, '{\n\n}'));
        this.editConfiguration(this.mapStructure.configurations.length - 1);
      });

  }

  removeConfiguration(index: number) {
    this.mapStructure.configurations.splice(index, 1);
    this.updateMapStructure();
    this.selectedConfiguration = null;
  }

  editConfiguration(index: number) {
    const re = new RegExp('\",\"', 'g');
    this.value = (JSON.stringify(this.mapStructure.configurations[index].value) || '').replace(re, '\", \n\"');
    // this.mapStructure.configurations[index].value = (JSON.stringify(this.mapStructure.configurations[index].value) || '').replace(re, '\", \n\"');
    this.selectedConfiguration = this.mapStructure.configurations[index];
  }

  updateMapStructure() {
    try {
      this.selectedConfiguration.value = JSON.parse(this.value);
      this.mapsService.setCurrentMapStructure(this.mapStructure);
    } catch (err) {}
  }

}
