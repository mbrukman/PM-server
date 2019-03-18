import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { BsModalService } from 'ngx-bootstrap/modal';

import { ProjectsService } from '../projects.service';
import { Project } from '../models/project.model';
import { Map } from '../../maps/models/map.model';
import { ConfirmComponent } from '../../shared/confirm/confirm.component';
import { ImportModalComponent } from './import-modal/import-modal.component';
import {DistinctMapResult} from '@shared/model/distinct-map-result.model';
import { FilterOptions } from '@shared/model/filter-options.model'


@Component({
  selector: 'app-project-details',
  templateUrl: './project-details.component.html',
  styleUrls: ['./project-details.component.scss']
})
export class ProjectDetailsComponent implements OnInit, OnDestroy {
  project: Project;
  id: string;
  projectReq: any;
  routeReq: any;
  archiveReq: any;
  filterTerm: string;
  filterOptions : FilterOptions = new FilterOptions();
  featuredMaps: DistinctMapResult[] = [];

  constructor(private route: ActivatedRoute,
    private router: Router,
    private projectsService: ProjectsService,
    private modalService: BsModalService) { }

  ngOnInit() {
    this.routeReq = this.route.params.subscribe(params => {
      this.id = params['id'];
      this.getProjectDetails();
      this.projectsService.filterRecentMaps(this.id).subscribe(recentMaps => {
        this.featuredMaps = recentMaps;
      })
    });
  }

  getProjectDetails(){
    this.projectReq = this.projectsService.detail(this.id, this.filterOptions).subscribe(project => {
      if (!project) {
        this.router.navigate(['NotFound'])
      }
      this.project = project;
    },
    error => {
      this.router.navigate(['NotFound'])
    }
  );
  }

  ngOnDestroy() {
    this.routeReq.unsubscribe();
    if (this.projectReq) {
      this.projectReq.unsubscribe();
    }
    if (this.archiveReq) {
      this.archiveReq.unsubscribe();
    }
  }

  archiveProject(doArchive: boolean) {
    doArchive ? this.archiveOn() : this.projectsService.archive(this.id, false).subscribe(() =>{this.project.archived = false});
  }

  private archiveOn() {
    let modal = this.modalService.show(ConfirmComponent);
    modal.content.title = 'Archive this project?';
    modal.content.message = 'When archiving a project, all the maps will be archived as well.';
    modal.content.confirm = 'Yes, archive';
    modal.content.result.subscribe(result => {
      if (result) {
        this.archiveReq = this.projectsService.archive(this.id, true).subscribe(() => { this.project.archived = true; });
      }
    });
  }


  openImportModal() {
    const modal = this.modalService.show(ImportModalComponent);
    modal.content.projectId = this.id;
  }

}
