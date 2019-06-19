import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { MapsService } from '../maps.service';
import { Map } from '../models/map.model';
import { Project } from '../../projects/models/project.model';
import { ProjectsService } from '../../projects/projects.service';
import { SelectItem } from 'primeng/primeng';
import { FilterOptions } from '@shared/model/filter-options.model';

@Component({
  selector: 'app-map-create',
  templateUrl: './map-create.component.html',
  styleUrls: ['./map-create.component.scss']
})
export class MapCreateComponent implements OnInit, OnDestroy {
  mapForm: FormGroup;
  projects: Project[];
  paramsReq: any;
  map: Map;
  projectsDropDown:SelectItem[];
  newProject:boolean = false;
  NEW_PROJECT :String = 'createNewProject'
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
              name: map.name || '',
              description: map.description || ''
            });
          });
        }
      } else {
        this.initMapForm();
      }
      var filterOptions : FilterOptions = {isArchived:false,globalFilter:null,sort:'-createdAt'};
      this.projectsService.filter(null,filterOptions).subscribe(data => {
        this.projects = data.items;
        let projectOptions = this.projects.map(project => {
          return {label:project.name,value:project._id}
        })
        this.projectsDropDown = [{label:'New Project', value: this.NEW_PROJECT}]
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

  }

  ngOnDestroy() {
    this.paramsReq.unsubscribe();
  }

  initMapForm(project?) {
    this.mapForm = new FormGroup({
      projectName: new FormControl(''),
      projectDescription: new FormControl(""),
      project: new FormControl(project || '', Validators.required),
      name: new FormControl(null, Validators.required),
      description: new FormControl('')
    });
  }

  setFormValues(data: { name: string, description: string}) {
    this.mapForm.controls.name.setValue(data.name || '');
    this.mapForm.controls.description.setValue(data.description || '');
  }


  onProjectChange(val){
    this.newProject = val.value == this.NEW_PROJECT
    if(this.newProject){
      this.mapForm.controls.projectName.setValidators( Validators.required)
    }else{
     this.mapForm.controls.projectName.setValidators(null)
    }
    this.mapForm.controls.projectName.updateValueAndValidity();
  }
  onSubmitForm(value) {
    if (this.map) {
      this.mapsService.updateMap(this.map.id, value).subscribe(map => {
        this.navigateToMap(this.map.id);
      });
    } else {
      if(this.mapForm.controls.project.value==this.NEW_PROJECT){
        this.projectsService.create({name:value.projectName, description: value.projectDescription}).subscribe(res=>{
          value.project = res.id 
          this.createMap(value)
        })
      }
      else{
        this.createMap(value)
      }
    }
  }

  createMap(value){
    this.mapsService.createMap(value).subscribe(map => {
      this.navigateToMap(map.id);
    });
  }

  navigateToMap(mapId : string){
    this.router.navigate(['/maps', mapId]);
  }

}
