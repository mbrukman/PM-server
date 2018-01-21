import { Component, EventEmitter, OnDestroy, Output } from '@angular/core';
import { MapsService } from "../maps/maps.service";
import { Map } from "../maps/models/map.model";
import { Project } from "../projects/models/project.model";
import { ProjectsService } from "../projects/projects.service";


@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnDestroy {
  @Output() close: EventEmitter<any> = new EventEmitter<any>();
  query: string;
  maps: Map[];
  projects: Project[];
  timeout: any;
  loading: boolean = false;
  mapReq: any;
  projectReq: any;

  constructor(private mapsService: MapsService, private projectsService: ProjectsService) {
  }

  ngOnDestroy() {
    if (this.mapReq)
      this.mapReq.unsubscribe();
    if (this.projectReq)
      this.projectReq.unsubscribe();
  }

  onKeyUp() {
    this.maps = this.projects = null;
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      this.loading = true;
      this.mapReq = this.mapsService.filterMaps(null, null, null, this.query).subscribe(data => {
        this.maps = data.items;
        this.loading = false;
      });
      this.projectReq = this.projectsService.filter(null, null, null, this.query).subscribe(data => {
        this.projects = data.items;
        this.loading = false;
      });
    }, 400);
  }

  onClose() {
    this.close.emit();
  }
}
