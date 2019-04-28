import { Component, OnDestroy, OnInit,ViewChild,ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { BsModalService } from 'ngx-bootstrap/modal';

import { ProjectsService } from '../projects.service';
import { Project } from '../models/project.model';
import { Map } from '../../maps/models/map.model';
import { ConfirmComponent } from '../../shared/confirm/confirm.component';
import { ImportModalComponent } from './import-modal/import-modal.component';
import {DistinctMapResult} from '@shared/model/distinct-map-result.model';
import { FilterOptions } from '@shared/model/filter-options.model'
import { debounceTime } from 'rxjs/operators';
import { Subscription, fromEvent } from 'rxjs';
import {MapsService} from '@maps/maps.service';

@Component({
  selector: 'app-project-details',
  templateUrl: './project-details.component.html',
  styleUrls: ['./project-details.component.scss']
})
export class ProjectDetailsComponent implements OnInit, OnDestroy {
  project: Project;
  maps:Map[]
  id: string;
  projectReq: any;
  routeReq: any;
  archiveReq: any;
  filterTerm: string;
  filterOptions : FilterOptions = new FilterOptions();
  featuredMaps: DistinctMapResult[] = [];
  page: number = 1;
  filterKeyUpSubscribe: Subscription;
  @ViewChild('globalFilter') globalFilterElement : ElementRef;
  constructor(private route: ActivatedRoute,
    private router: Router,
    private projectsService: ProjectsService,
    private modalService: BsModalService,
    private mapsService:MapsService) { }

  ngOnInit() {
    this.routeReq = this.route.params.subscribe(params => {
      this.id = params['id'];
      this.filterOptions.filter = {projectId : this.id};
      this.getProjectDetails(null,1);
      this.projectsService.filterRecentMaps(this.id).subscribe(recentMaps => {
        this.featuredMaps = recentMaps;
      })
      this.filterKeyUpSubscribe = fromEvent(this.globalFilterElement.nativeElement,'keyup').pipe(
        debounceTime(300)
      ).subscribe(()=>{
          this.loadMapsLazy();
        })
    });
  }

  getProjectDetails(fields=null,page= 1){
    this.projectReq = this.projectsService.detail(this.id, this.filterOptions).subscribe(project => {
      if (!project) {
        this.router.navigate(['NotFound'])
      }
      this.project = project;
      this.mapsService.filterMaps(fields,page,this.filterOptions).subscribe(maps => {
        this.maps = maps.items
      })
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

  clearSearchFilter(){
    this.filterOptions.globalFilter = undefined;
    this.loadMapsLazy()
  }

  loadMapsLazy(event?) {
    let fields, page, sort;
    if (event) {
      fields = event.filters || null;
      page = event.first / 5 + 1;
      if (event.sortField) {
        sort = event.sortOrder === -1 ? '-' + event.sortField : event.sortField;
      }
    }
    this.filterOptions.sort = sort
    this.filterOptions.filter.projectId = this.id;
    this.getProjectDetails(fields,page)
  }

  openImportModal() {
    const modal = this.modalService.show(ImportModalComponent);
    modal.content.projectId = this.id;
  }

}
