import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';
import { filter, tap, mergeMap } from "rxjs/operators";;

import { MapsService } from '../../maps.service';
import { Map } from '@maps/models/map.model';
import { ProjectsService } from '@projects/projects.service';
import { Project } from '@projects/models/project.model';

@Component({
  selector: 'app-map-properties',
  templateUrl: './map-properties.component.html',
  styleUrls: ['./map-properties.component.scss']
})
export class MapPropertiesComponent implements OnInit, OnDestroy {
  map: Map;
  projects: Project[];
  projectsDropDown = [];
  mapSubscription: Subscription;
  projectsReq: any;
  selectedProject: string;
  queue: number;
  onInit:boolean;

  constructor(private mapsService: MapsService, private projectsService: ProjectsService) {
  }

  ngOnInit() {
    this.onInit = true;
    this.mapSubscription = this.mapsService.getCurrentMap().pipe(
      tap(map => this.map = map),
      filter(map => map),
      mergeMap(() => this.projectsService.list(null,null,{isArchived:false,globalFilter:null,sort:'-createdAt'}))// filtering empty map result
    ).subscribe(data => {
        this.projects = data.items;
        this.projectsDropDown = this.projects.map(project => {
          return {label:project.name,value:project._id}
        })
        let project = this.projects.find((o) => (<string[]>o.maps).indexOf(this.map.id) > -1);
        if (project && this.onInit) {
          this.selectedProject = project._id;
          this.onInit = false;
        }
      });
  }

  ngOnDestroy() {
    this.mapSubscription.unsubscribe();
  }

  onMapUpdate() {
    this.mapsService.setCurrentMap(this.map);
  }

  onChangeProject() {
    let mapObj = Object.assign({}, this.map, { project: this.selectedProject });
    this.mapsService.setCurrentMap(mapObj);
  }

  archiveMap(isArchive:boolean) {
    this.mapsService.archive(this.map.id, isArchive).subscribe(() => {
      this.map.archived = isArchive;
      this.mapsService.setCurrentMap(this.map);
    });
  }

}
