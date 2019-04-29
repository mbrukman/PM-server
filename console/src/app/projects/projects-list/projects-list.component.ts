import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ProjectsService } from '../projects.service';
import { Project } from '../models/project.model';
import { FilterOptions } from '@shared/model/filter-options.model'
import { Subscription, fromEvent } from 'rxjs'
import { take, debounceTime } from 'rxjs/operators';
import { ActivatedRoute, Data } from '@angular/router';

import {SeoService} from '@app/seo.service';

@Component({
  selector: 'app-projects-list',
  templateUrl: './projects-list.component.html',
  styleUrls: ['./projects-list.component.scss']
})
export class ProjectsListComponent implements OnInit, OnDestroy {
  projects: Project[];
  projectsReq: any;
  featuredReq: any;
  featuredProjects: Project[];
  page: number = 1;
  resultCount: number;
  filterOptions : FilterOptions = new FilterOptions();
  filterKeyUpSubscribe : Subscription;
  
  @ViewChild('globalFilter') globalFilterElement : ElementRef;


  constructor(private projectsService: ProjectsService,
    private route:ActivatedRoute,
    private seoService:SeoService) {
    this.onDataLoad = this.onDataLoad.bind(this);
  }

  ngOnInit() {
    this.seoService.setTitle(this.seoService.ProjectsList)
    this.route.data.subscribe((data:Data) => {
      this.onDataLoad(data['projects']);
    })

    this.filterKeyUpSubscribe = fromEvent(this.globalFilterElement.nativeElement,'keyup').pipe(
      debounceTime(300)
    ).subscribe(()=>{
        this.loadProjectLazy();
      })

    let featuredFilterOptions = new FilterOptions();
    featuredFilterOptions.limit = 4;
    this.projectsService.filter(null, this.page,featuredFilterOptions).pipe(
      take(1)).subscribe(data => {
      if (data)
        this.featuredProjects = data.items;
    });
  }

  ngOnDestroy(){
    this.filterKeyUpSubscribe.unsubscribe();
  }

  reloadProjects(fields=null,page=this.page,filter=this.filterOptions){
    this.projectsReq = this.projectsService.filter(fields,page,filter).subscribe(this.onDataLoad);
  }

  loadProjectLazy(event?) {
    let fields, page, sort;
    if (event) {
      fields = event.filters || null;
      page = event.first / 5 + 1;
      if (event.sortField) {
        sort = event.sortOrder === -1 ? '-' + event.sortField : event.sortField;
      }
    }
    this.filterOptions.sort = sort
    this.reloadProjects(fields,page,this.filterOptions)
  }

  onDataLoad(data){
    if (!data) return;
    this.projects = data.items;
    this.resultCount = data.totalCount;
  }

}

