import { Component, OnInit, OnDestroy } from '@angular/core';
import {PopupService} from '@shared/services/popup.service'
import { MapStructureConfiguration, MapStructure } from '@maps/models';
import { MapsService } from '@maps/maps.service';
import { AddConfigurationComponent } from '@maps/map-detail/map-configurations/add-configuration/add-configuration.component';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-main-map-configurations',
  templateUrl: './map-configurations.component.html',
  styleUrls: ['./map-configurations.component.scss']
})
export class MapConfigurationsComponent implements OnInit ,OnDestroy{
  selectedConfiguration: MapStructureConfiguration;
  mapStructure: MapStructure;
  editorOptions = {
    theme: 'vs-dark',
    language: 'json'
  };
  value: string = '';
  mapStructureSubscription: Subscription;

  constructor(private mapsService: MapsService, private popupService:PopupService) { }

  ngOnInit() {
    this.mapStructureSubscription =  this.mapsService.getCurrentMapStructure().pipe(
      filter(structure => !!structure)
    ).subscribe(structure => {
        this.mapStructure = structure;
        if (!this.selectedConfiguration && structure.hasOwnProperty('configurations') && structure.configurations.length) {
          this.editConfiguration(0);
        }
      });
  }

  ngOnDestroy(){
    this.mapStructureSubscription.unsubscribe()
  }

  addNewConfiguration() {
    this.popupService.openComponent(AddConfigurationComponent,{configurations:this.mapStructure.configurations})
      .filter(name => !!name)
      .subscribe(name => {
        this.mapStructure.configurations.push(new MapStructureConfiguration(name, '{\n\n}'));
        this.editConfiguration(this.mapStructure.configurations.length - 1);
      });
  }

  editConfigurationName(index:number) {
    this.popupService.openComponent(AddConfigurationComponent,{configurations:this.mapStructure.configurations,name:this.mapStructure.configurations[index].name})
      .filter(name => !!name)
      .subscribe(name => {
        this.mapStructure.configurations[index].name = name;
        this.editConfiguration(index);
      });
  }

  removeConfiguration(index: number) {
    this.mapStructure.configurations.splice(index, 1);
    this.updateMapStructure(true);
    this.selectedConfiguration = null;
  }

  editConfiguration(index: number) {
    if ((typeof this.mapStructure.configurations[index].value) === 'object') {
      this.value = (JSON.stringify(this.mapStructure.configurations[index].value,null,'\t') || '');
    } else {
      this.value = <string>this.mapStructure.configurations[index].value;
    }

    this.selectedConfiguration = this.mapStructure.configurations[index];
    this.updateMapStructure();
  }

  updateMapStructure(remove = false) {
    try {
      if(!remove)this.selectedConfiguration.value = JSON.parse(this.value);
      this.mapsService.setCurrentMapStructure(this.mapStructure);
    } catch (err) {
      console.log(err)
    }
  }
}
