import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {SelectItem} from 'primeng/primeng';
import {empty, iif, of, Subscription} from 'rxjs';

import {MapsService} from '@app/services/map/maps.service';
import {Map} from '@app/services/map/models/map.model';
import {Project} from '@projects/models/project.model';
import {ProjectsService} from '@projects/projects.service';
import {FilterOptions} from '@shared/model/filter-options.model';
import {map, switchMap} from 'rxjs/operators';

@Component({
  selector: 'app-map-create',
  templateUrl: './map-create.component.html',
  styleUrls: ['./map-create.component.scss']
})
export class MapCreateComponent implements OnInit, OnDestroy {
  mapForm: FormGroup;
  projects: Project[];
  map: Map;
  projectsDropDown: SelectItem[];
  newProject = false;
  NEW_PROJECT = 'createNewProject';

  private mainSubscription = new Subscription();

  constructor(private mapsService: MapsService, private projectsService: ProjectsService, private router: Router, private route: ActivatedRoute) {
  }

  ngOnInit() {
    const queryParamsSubscription = this.route.queryParams
      .subscribe(params => {
        if (params) {
          this.initMapForm(params.project);
          if (params.map) {
            this.mapsService.getMap(params.map).subscribe(map => {
              this.map = map;
              this.setFormValues({
                name: map.name || '',
                description: map.description || ''
              });
            });
          }
        } else {
          this.initMapForm();
        }
        const filterOptions: FilterOptions = {isArchived: false, globalFilter: null, sort: '-createdAt'};
        this.projectsService.filter(null, filterOptions).subscribe(data => {
          this.projects = data.items;
          let projectOptions = this.projects.map(project => {
            return {label: project.name, value: project._id};
          });
          this.projectsDropDown = [{label: 'Create New Project', value: this.NEW_PROJECT}];
          this.projectsDropDown.push(...projectOptions);

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
    this.mainSubscription.add(queryParamsSubscription);
  }


  initMapForm(project?) {
    this.mapForm = new FormGroup({
      projectName: new FormControl(''),
      projectDescription: new FormControl(''),
      project: new FormControl(project || '', Validators.required),
      name: new FormControl(null, Validators.required),
      description: new FormControl('')
    });
  }

  setFormValues(data: { name: string, description: string }) {
    this.mapForm.controls.name.setValue(data.name || '');
    this.mapForm.controls.description.setValue(data.description || '');
  }


  onProjectChange(val) {
    this.newProject = val.value === this.NEW_PROJECT;
    if (this.newProject) {
      this.mapForm.controls.projectName.setValidators(Validators.required);
    } else {
      this.mapForm.controls.projectName.setValidators(null);
    }
    this.mapForm.controls.projectName.updateValueAndValidity();
  }

  private handleMapCreation(value) {
    const createMap$ = this.mapsService.createMap(value)
      .pipe(map(createdMap => this.navigateToMap(createdMap.id)));
    if (this.mapForm.controls.project.value === this.NEW_PROJECT) {
      return this.projectsService.create({
        name: value.projectName,
        description: value.projectDescription
      }).pipe(
        map(res => value.project = res.id),
        switchMap(() => createMap$)
      );
    }
    return createMap$;
  }


  onSubmitForm(value) {
    const submitFormSubscription = of('')
      .pipe(
        switchMap(() => {

          if (this.map) {
            return this.mapsService.updateMap(this.map.id, value)
              .pipe(map(() => this.navigateToMap(this.map.id)));
          }
          return this.handleMapCreation(value);
        })
      ).subscribe();

    this.mainSubscription.add(submitFormSubscription);
  }

  navigateToMap(mapId: string) {
    this.router.navigate(['/maps', mapId]);
  }

  ngOnDestroy(): void {
    this.mainSubscription.unsubscribe();
  }
}
