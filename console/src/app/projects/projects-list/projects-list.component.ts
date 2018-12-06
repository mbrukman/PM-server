import { Component, OnInit } from '@angular/core';
import { ProjectsService } from '../projects.service';
import { Project } from '../models/project.model';
import { FilterOptions } from '@shared/model/filter-options.model'
import 'rxjs/operators/take';

@Component({
  selector: 'app-projects-list',
  templateUrl: './projects-list.component.html',
  styleUrls: ['./projects-list.component.scss']
})
export class ProjectsListComponent implements OnInit {
  projects: Project[];
  projectsReq: any;
  featuredReq: any;
  featuredProjects: Project[];
  filterTerm: string;
  page: number = 1;
  resultCount: number;
  filterOptions : FilterOptions = new FilterOptions();

  constructor(private projectsService: ProjectsService) {
    this.onDataLoad = this.onDataLoad.bind(this);
  }

  ngOnInit() {

    this.projectsReq  = this.projectsService.filter(null, null, this.page,this.filterOptions).subscribe(this.onDataLoad);

    this.projectsService.filter(null, '-createdAt', this.page,{isArchived:false,globalFilter:null}).take(1).subscribe(data => {
      if (data)
        this.featuredProjects = data.items.slice(0, 4);
      // console.log(">>", this.featuredProjects);
    });
  }

  getArchive(){
    this.projectsReq  = this.projectsService.filter(null, null, this.page,this.filterOptions).subscribe(this.onDataLoad);
  }

  loadProjectLazy(event) {
    let fields, page, sort;
    if (event) {
      fields = event.filters || null;
      page = event.first / 5 + 1;
      if (event.sortField) {
        sort = event.sortOrder === -1 ? '-' + event.sortField : event.sortField;
      }
    }
    this.getArchive()
  }

  onDataLoad(data){
    if (!data) return;
    this.projects = data.items;
    this.resultCount = data.totalCount;
  }

}

