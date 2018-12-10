import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs/Subscription';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/filter';

import { MapsService } from '../../maps.service';
import { Map } from '@maps/models/map.model';
import { ProjectsService } from '@projects/projects.service';
import { Project } from '@projects/models/project.model';

@Component({
  selector: 'app-map-metadata',
  templateUrl: './map-properties.component.html',
  styleUrls: ['./map-properties.component.scss']
})
export class MapPropertiesComponent implements OnInit, OnDestroy {
  map: Map;
  projects: Project[];
  mapSubscription: Subscription;
  projectsReq: any;
  selectedProject: string;
  queue: number;

  constructor(private mapsService: MapsService, private projectsService: ProjectsService) {
  }

  ngOnInit() {
    this.mapSubscription = this.mapsService.getCurrentMap()
      .filter(map => map) // filtering empty map result
      .do(map => this.map = map)
      .filter(map => !this.projects)
      .flatMap(() => this.projectsService.list(null,null,null,{isArchived:false}))
      .subscribe(data => {
        this.projects = data.items;
        let project = this.projects.find((o) => (<string[]>o.maps).indexOf(this.map.id) > -1);
        if (project) {
          this.selectedProject = project._id;
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
    this.mapsService.archive(this.map.id).subscribe(() => {
      this.map.archived = isArchive;
      this.mapsService.setCurrentMap(this.map);
    });
  }

}
