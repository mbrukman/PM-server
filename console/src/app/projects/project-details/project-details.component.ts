import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { BsModalService } from 'ngx-bootstrap/modal';

import { ProjectsService } from '../projects.service';
import { Project } from '../models/project.model';
import { Map } from '../../maps/models/map.model';
import { ConfirmComponent } from '../../shared/confirm/confirm.component';

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
  featuredMaps: Map[];

  constructor(private route: ActivatedRoute, private router: Router, private projectsService: ProjectsService, private modalService: BsModalService) {
  }

  ngOnInit() {
    this.routeReq = this.route.params.subscribe(params => {
      this.id = params['id'];
      this.projectReq = this.projectsService.detail(this.id).subscribe(project => {
          if (!project) {
            this.router.navigate(['NotFound'])
          }
          this.project = project;
          this.featureMaps(project.maps);
        },
        error => {
          this.router.navigate(['NotFound'])
        }
      );
    });
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

  archiveProject() {
    let modal = this.modalService.show(ConfirmComponent);
    modal.content.title = 'Archive this project?';
    modal.content.message = 'When archiving a project, all the maps will be archived as well.';
    modal.content.confirm = 'Yes, archive';
    modal.content.result.subscribe(result => {
      if (result) {
        this.archiveReq = this.projectsService.archive(this.id).subscribe(() => this.project.archived = true);
      }
    });
  }

  featureMaps(maps) {
    maps = maps.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });
    this.featuredMaps = maps.slice(0, 4);
  }

}
