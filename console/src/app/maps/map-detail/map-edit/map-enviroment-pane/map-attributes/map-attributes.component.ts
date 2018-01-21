import { Component, OnInit } from '@angular/core';

import { Subscription } from 'rxjs/Subscription';
import { BsModalRef, BsModalService } from 'ngx-bootstrap';
import * as _ from 'lodash';

import { AddAttributeComponent } from './add-attribute/add-attribute.component';
import { MapsService } from '../../../../maps.service';
import { MapStructure } from '../../../../models/map-structure.model';

@Component({
  selector: 'app-map-attributes',
  templateUrl: './map-attributes.component.html',
  styleUrls: ['./map-attributes.component.scss']
})
export class MapAttributesComponent implements OnInit {
  mapStructureSubscription: Subscription;
  mapStructure: MapStructure;

  constructor(private modalService: BsModalService, private mapsService: MapsService) {
  }

  ngOnInit() {
    this.mapStructureSubscription = this.mapsService.getCurrentMapStructure().subscribe(structure => {
      this.mapStructure = structure;
    });
  }

  openAddAttributeModal(index?) {
    const attribute = index ? this.mapStructure.attributes[index] : null;
    const attributesNames = this.mapStructure.attributes ? this.mapStructure.attributes.reduce((total, current, i) => {
      if (index !== i) {
        total.push(current.name);
      }
      return total;
    }, []) : [];
    let modal: BsModalRef;
    modal = this.modalService.show(AddAttributeComponent);
    modal.content.attribute = attribute;
    modal.content.forbiddenNames = attributesNames;
    modal.content.result.subscribe(result => {
      if (index || index === 0) {
        if (this.mapStructure.attributes) {
          this.mapStructure.attributes[index] = result;
        } else {
          this.mapStructure.attributes = [result];
        }
      } else {
        this.mapStructure.attributes.push(result);
      }
      this.mapsService.setCurrentMapStructure(this.mapStructure);
    });

  }

  removeAttribute(index) {
    this.mapStructure.attributes.splice(index, 1);
    this.mapsService.setCurrentMapStructure(this.mapStructure);
  }

}
