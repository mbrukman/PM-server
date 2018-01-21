import { Component, OnInit } from '@angular/core';
import { ProjectsService } from '../projects.service';
import { Project } from '../models/project.model';

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

  constructor(private projectsService: ProjectsService) {
  }

  ngOnInit() {
    this.projectsReq = this.projectsService.filter(null, null, this.page).subscribe(data => {
      this.projects = data.items;
      this.resultCount = data.totalCount;
    });
    this.projectsService.filter(null, '-createdAt', this.page).take(1).subscribe(data => {
      this.featuredProjects = data.items.slice(0, 4);
      console.log(">>", this.featuredProjects);
    });
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
    this.projectsService.filter(fields, sort, page, this.filterTerm).subscribe(data => {
      this.projects = data.items;
      this.resultCount = data.totalCount;
    });
  }

}

