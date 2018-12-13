import { Component, EventEmitter, OnDestroy, Output, OnInit } from '@angular/core';
import { MapsService } from '../maps/maps.service';
import { Map } from '../maps/models/map.model';
import { Project } from '../projects/models/project.model';
import { ProjectsService } from '../projects/projects.service';
import { FilterOptions } from '@shared/model/filter-options.model';


@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnDestroy, OnInit {
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

  ngOnInit() {
    this.onKeyUp(5)
  }

  ngOnDestroy() {
    if (this.mapReq) {
      this.mapReq.unsubscribe();
    }
    if (this.projectReq) {
      this.projectReq.unsubscribe();
    }
  }

  onKeyUp(limit ?: number ) {
    this.maps = this.projects = null;
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      var filterOptions : FilterOptions = {isArchived:false,globalFilter:this.query,sort:'-createdAt'};
      if (limit)
        filterOptions.limit = limit;
      
      this.loading = true;
      this.mapReq = this.mapsService.filterMaps(null, null, filterOptions).subscribe(data => {
        this.maps = data.items;
        this.loading = false;
      });
      this.projectReq = this.projectsService.filter(null, null, filterOptions).subscribe(data => {
        this.projects = data.items;
        this.loading = false;
      });
    }, 400);
  }

  onClose() {
    this.close.emit();
  }
}
