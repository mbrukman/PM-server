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
    this.filterOptions = this._getObjectFrom(this.route.snapshot.queryParams)
    this.seoService.setTitle(PageTitleTypes.ProjectsList)
    this.route.data.subscribe((data:Data) => {
      this.onDataLoad(data['projects']);
    })

    let featuredFilterOptions = new FilterOptions();	
    featuredFilterOptions.limit = 4;	
    this.projectsService.filter(null, featuredFilterOptions).pipe(	
      take(1)).subscribe(data => {	
      if (data)	
        this.featuredProjects = data.items;	
    });

    this.filterKeyUpSubscribe = fromEvent(this.globalFilterElement.nativeElement,'keyup').pipe(
      debounceTime(300)
    ).subscribe(()=>{
        this.loadProjectLazy();
      })
  }

  ngOnDestroy(){
    this.filterKeyUpSubscribe.unsubscribe();
  }

  _getObjectFrom(obj) : FilterOptions{
    let data = this.filterOptions
    let filterKeys = Object.keys(obj)
    filterKeys.forEach(field=>{
      data[field] = obj[field] || this.filterOptions[field]
    })
    return data;
  }

  updateUrl(): void {
    let data =  Object.assign({}, this._getObjectFrom(this.filterOptions))
    delete data.filter
    this.router.navigate(['projects'], { queryParams:  data });
  }

  clearSearchFilter(){
    this.filterOptions.globalFilter = undefined;
    this.loadProjectLazy()
    this.updateUrl()
  }


  reloadProjects(fields=null,filter=this.filterOptions){
    this.updateUrl()
    this.projectsService.filter(fields,filter).subscribe(this.onDataLoad);
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
    this.filterOptions.page = page
    this.reloadProjects(fields,this.filterOptions)
  }

  onDataLoad(data){
    if (!data) return;
    this.projects = data.items;
    this.resultCount = data.totalCount;
  }

}

