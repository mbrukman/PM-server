import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ProjectsService } from '../projects.service';
import { Project } from '../models/project.model';
import { FilterOptions } from '@shared/model/filter-options.model'
import { Subscription, fromEvent } from 'rxjs'
import { take, debounceTime } from 'rxjs/operators';
import { ActivatedRoute, Data, Router } from '@angular/router';

import {SeoService,PageTitleTypes} from '@app/seo.service';

@Component({
  selector: 'app-projects-list',
  templateUrl: './projects-list.component.html',
  styleUrls: ['./projects-list.component.scss']
})
export class ProjectsListComponent implements OnInit, OnDestroy {
  projects: Project[];
  featuredProjects: Project[];
  page: number = 1;
  resultCount: number;
  filterOptions : FilterOptions = new FilterOptions();
  filterKeyUpSubscribe : Subscription;
  isInit:boolean=true;

  @ViewChild('globalFilter') globalFilterElement : ElementRef;

  constructor(private projectsService: ProjectsService,
    private route:ActivatedRoute,
    private seoService:SeoService,
    private readonly router: Router) {
    this.onDataLoad = this.onDataLoad.bind(this);
  }

  ngOnInit() {
    this.seoService.setTitle(PageTitleTypes.ProjectsList)
    this.route.data.subscribe((data:Data) => {
      this.onDataLoad(data['projects']);
    })

    let featuredFilterOptions = new FilterOptions();	
    featuredFilterOptions.limit = 4;	
    this.projectsService.filter(null, this.page,featuredFilterOptions).pipe(	
      take(1)).subscribe(data => {	
      if (data)	
        this.featuredProjects = data.items;	
    });

    this.filterKeyUpSubscribe = fromEvent(this.globalFilterElement.nativeElement,'keyup').pipe(
      debounceTime(300)
    ).subscribe(()=>{
        this.loadProjectLazy();
      })


      let params = this.route.snapshot.queryParams
      this.page = params.page;
      this.filterOptions.isArchived = params.archive? params.archive!='false' : null
      this.filterOptions.sort = params.sort
      this.filterOptions.globalFilter = params.filter
      this.reloadProjects()
  }

  ngOnDestroy(){
    this.filterKeyUpSubscribe.unsubscribe();
  }


  updateUrl(page=this.page): void {
    this.router.navigate(['projects'], { queryParams:  { archive: this.filterOptions.isArchived, page: page, sort: this.filterOptions.sort, filter: this.filterOptions.globalFilter} });
  }

  clearSearchFilter(){
    this.filterOptions.globalFilter = undefined;
    this.loadProjectLazy()
    this.updateUrl()
  }


  reloadProjects(fields=null,page=this.page,filter=this.filterOptions){
    this.updateUrl(page)
    this.projectsService.filter(fields,page,filter).subscribe(this.onDataLoad);
  }

  loadProjectLazy(event?) {
    let fields, page;
    if (event) {
      fields = event.filters || null;
      page = event.first / 5 + 1;
      if (event.sortField) {
        this.filterOptions.sort = event.sortOrder === -1 ? '-' + event.sortField : event.sortField;
      }
    }
    if(this.isInit){
      this.isInit=false;
      return;
    }
    this.reloadProjects(fields,page,this.filterOptions)
  }

  onDataLoad(data){
    if (!data) return;
    this.projects = data.items;
    this.resultCount = data.totalCount;
  }

}

