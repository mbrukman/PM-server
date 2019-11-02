import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { MapsService } from '../services/map/maps.service';
import { Map } from '../services/map/models/map.model';
import { Project } from '@projects/models/project.model';
import { ProjectsService } from '@projects/projects.service';
import { FilterOptions } from '@shared/model/filter-options.model';


@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit {
  @Output() close: EventEmitter<any> = new EventEmitter<any>();
  query: string;
  maps: Map[];
  projects: Project[];
  timeout: any;
  loading: boolean = false;

  constructor(private mapsService: MapsService, private projectsService: ProjectsService) {
  }

  ngOnInit() {
    this.onKeyUp(5)
  }

  onKeyUp(limit ?: number ) {
    this.maps = this.projects = null;
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      var filterOptions : FilterOptions = {isArchived:false,globalFilter:this.query,sort:'-createdAt'};
      if (limit){
        filterOptions.limit = limit;
      }

      this.loading = true;
      this.mapsService.filterMaps(null, filterOptions).subscribe(data => {
        this.maps = data.items;
        this.loading = false;
      });
      this.projectsService.filter(null, filterOptions).subscribe(data => {
        this.projects = data.items;
        this.loading = false;
      });
    }, 400);
  }

  onClose() {
    this.close.emit();
  }
}
