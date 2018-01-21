import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { MapsService } from '../maps.service';
import { Map } from '../models/map.model';
import { Project } from '../../projects/models/project.model';
import { ProjectsService } from '../../projects/projects.service';
import { DefaultKeyValueDiffer } from '@angular/core/src/change_detection/differs/default_keyvalue_differ';

@Component({
  selector: 'app-map-create',
  templateUrl: './map-create.component.html',
  styleUrls: ['./map-create.component.scss']
})
export class MapCreateComponent implements OnInit, OnDestroy {
  mapForm: FormGroup;
  projectsReq: any;
  projects: Project[];
  paramsReq: any;
  map: Map;

  constructor(private mapsService: MapsService, private projectsService: ProjectsService, private router: Router, private route: ActivatedRoute) {
  }

  ngOnInit() {
    this.paramsReq = this.route.queryParams.subscribe(params => {
      if (params) {
        this.initMapForm(params.project);
        if (params.map) {
          this.mapsService.getMap(params.map).subscribe(map => {
            this.map = map;
            this.setFormValues({
              name: map.name || null,
              description: map.description || null,
              licence: map.licence || null
            });
          });
        }
      } else {
        this.initMapForm();
      }
      this.projectsReq = this.projectsService.filter().subscribe(data => {
        this.projects = data.items;
        if (params.map) {
          data.items.forEach(project => {
            const index = (<string[]>project.maps).indexOf(params.map);
            if (index !== -1) {
              this.mapForm.controls.project.setValue(project._id);
            }
          });
        }
      });
    });

  }

  ngOnDestroy() {
    this.projectsReq.unsubscribe();
    this.paramsReq.unsubscribe();
  }

  initMapForm(project?) {
    this.mapForm = new FormGroup({
      project: new FormControl(project, Validators.required),
      name: new FormControl(null, Validators.required),
      description: new FormControl(),
      licence: new FormControl()
    });
  }

  setFormValues(data: { name: string, description: string, licence: string }) {
    this.mapForm.controls.name.setValue(data.name || null);
    this.mapForm.controls.description.setValue(data.description || null);
    this.mapForm.controls.licence.setValue(data.licence || null);
  }


  onSubmitForm(value) {
    if (this.map) {
      this.mapsService.updateMap(this.map.id, value).subscribe(map => {
        this.router.navigate(['/maps', this.map.id]);
      });
    } else {
      this.mapsService.createMap(value).subscribe(map => {
        this.router.navigate(['/maps', map.id]);
      });
    }
  }

}
