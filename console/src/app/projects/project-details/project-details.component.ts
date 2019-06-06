import { Component, OnDestroy, OnInit,ViewChild,ElementRef } from '@angular/core';
import { ActivatedRoute,Data, Router } from '@angular/router';
import { ProjectsService } from '../projects.service';
import { Project } from '../models/project.model';
import { PopupService } from '../../shared/services/popup.service';
import { ImportModalComponent } from './import-modal/import-modal.component';
import {DistinctMapResult} from '@shared/model/distinct-map-result.model';
import { FilterOptions } from '@shared/model/filter-options.model'
import { debounceTime } from 'rxjs/operators';
import { Subscription, fromEvent } from 'rxjs';
import {MapsService} from '@maps/maps.service';
import {Map} from '@maps/models/map.model';
import {SeoService,PageTitleTypes} from '@app/seo.service';

@Component({
  selector: 'app-project-details',
  templateUrl: './project-details.component.html',
  styleUrls: ['./project-details.component.scss']
})
export class ProjectDetailsComponent implements OnInit, OnDestroy {
  project: Project;
  maps:Map[]
  id: string;
  filterTerm: string;
  filterOptions : FilterOptions = new FilterOptions();
  featuredMaps: DistinctMapResult[] = [];
  page: number = 1;
  filterKeyUpSubscribe: Subscription;

  @ViewChild('globalFilter') globalFilterElement : ElementRef;
  constructor(private route: ActivatedRoute,
    private projectsService: ProjectsService,
    private popupService: PopupService,
    private mapsService:MapsService,
    private seoService:SeoService,
    private readonly router: Router) { }

  ngOnInit() {
    this.filterOptions = this._getObjectFrom(this.route.snapshot.queryParams)
    this.id = this.route.snapshot.params.id;
    this.filterOptions.filter = {};
    this.filterOptions.filter.projectId = this.id;
    this.route.data.subscribe((data:Data) => {
      this.project = data['projectDetails'];
      this.seoService.setTitle(this.project.name+PageTitleTypes.ProjectDetails)
    })
    this.projectsService.filterRecentMaps(this.id).subscribe(recentMaps => {
      this.featuredMaps = recentMaps;
    })
    this.filterKeyUpSubscribe = fromEvent(this.globalFilterElement.nativeElement,'keyup').pipe(
      debounceTime(300)
    ).subscribe(()=>{
        this.loadMapsLazy();
      })
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
    this.router.navigate(['projects', this.id], { queryParams: data});
  }

  getMaps(fields=null){
    this.mapsService.filterMaps(fields,this.filterOptions).subscribe(maps => {
      this.maps = maps.items
    })
    this.updateUrl()
  }

  ngOnDestroy() {
    this.filterKeyUpSubscribe.unsubscribe();
  }

  archiveProject(doArchive: boolean) {
    doArchive ? this.archiveOn() : this.projectsService.archive(this.id, false).subscribe(() =>{this.project.archived = false});
  }

  private archiveOn() {
    let confirm = 'Yes, archive';
    this.popupService.openConfirm('Archive this project?','When archiving a project, all the maps will be archived as well.',confirm,null,null)
    .subscribe(result => {
      if (result == confirm) {
        this.projectsService.archive(this.id, true).subscribe(() => { this.project.archived = true; });
      }
    });
  }

  clearSearchFilter(){
    this.filterOptions.globalFilter = undefined;
    this.loadMapsLazy()
  }

  loadMapsLazy(event?) {
    let fields, page;
    if (event) {
      fields = event.filters || null;
      this.filterOptions.page = event.first / 5 + 1;
      if (event.sortField) {
        this.filterOptions.sort = event.sortOrder === -1 ? '-' + event.sortField : event.sortField;
      }
    }
    this.getMaps(fields)
  }

  openImportModal() {
    this.popupService.openComponent(ImportModalComponent,{projectId:this.id});
  }
  


  onConfirmDelete(id) {
    let confirm ='Delete';
    this.popupService.openConfirm(null,'Are you sure you want to delete? all data related to the map will get permanently lost',confirm,'Cancel',null)
    .subscribe(ans => {
      if (ans === confirm) {
        this.deleteMap(id);
      }
    })

  }

  deleteMap(id) {
    this.mapsService.delete(id).subscribe(() => {
      for (let i = 0, lenght = this.featuredMaps.length; i < lenght; i++) {
        if (this.featuredMaps[i]._id == id) {
          this.featuredMaps.splice(i, 1);
          break;
        }
      }
      this.loadMapsLazy();
    });
  }


}
