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
  editor: any;

  constructor(private mapsService: MapsService, private modalService: BsModalService) { }

  onEditorInit(editor) {
    this.editor = editor;
    this.formatJson();
  }

  private formatJson() {
    if (!this.editor) {
      return;
    }
    setTimeout(() => {
      this.editor.getAction('editor.action.formatDocument').run();
    }, 50);
  }

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
    this.modalService.show(AddConfigurationComponent).content.result
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
    if ((typeof this.mapStructure.configurations[index].value) === 'object') {
      this.value = (JSON.stringify(this.mapStructure.configurations[index].value) || '');
      this.formatJson();
    } else {
      this.value = <string>this.mapStructure.configurations[index].value;
    }

    this.selectedConfiguration = this.mapStructure.configurations[index];
  }

  updateMapStructure() {
    try {
      this.selectedConfiguration.value = JSON.parse(this.value);
      this.mapsService.setCurrentMapStructure(this.mapStructure);
    } catch (err) {}
  }
}
