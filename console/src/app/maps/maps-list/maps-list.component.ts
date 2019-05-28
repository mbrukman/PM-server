import { Component, OnDestroy, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Subscription } from 'rxjs';
import * as _ from 'lodash';
import { MapsService } from '../maps.service';
import { Map } from '../models/map.model';
import { PopupService } from '@shared/services/popup.service';
import { FilterOptions } from '@shared/model/filter-options.model'
import { fromEvent } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { DistinctMapResult } from '@shared/model/distinct-map-result.model';
import { Data, ActivatedRoute, Router } from '@angular/router';
import {SeoService,PageTitleTypes} from '@app/seo.service';

@Component({
  selector: 'app-maps-list',
  templateUrl: './maps-list.component.html',
  styleUrls: ['./maps-list.component.scss']
})
export class MapsListComponent implements OnInit, OnDestroy {
  maps: Map[];
  resultCount: number = 0;
  page: number = 1;
  filterOptions: FilterOptions = new FilterOptions();
  recentMaps: DistinctMapResult[];
  filterKeyUpSubscribe: Subscription;
  isInit:boolean=true;

  @ViewChild('globalFilter') globalFilterElement: ElementRef;

  constructor(private mapsService: MapsService,
    private popupService: PopupService,
    private route: ActivatedRoute,
    private seoService:SeoService,
    private readonly router: Router) {
    this.onDataLoad = this.onDataLoad.bind(this)
  }


  ngOnInit() {
    this.seoService.setTitle(PageTitleTypes.MapsList)
    this.route.data.subscribe((data: Data) => {
      this.onDataLoad(data['maps']);
    })

    this.mapsService.recentMaps().subscribe(maps => {
      this.recentMaps = maps;
    })

    this.filterKeyUpSubscribe = fromEvent(this.globalFilterElement.nativeElement, 'keyup').pipe(debounceTime(300))
      .subscribe(() => {
        this.loadMapsLazy();
      })

      let params = this.route.snapshot.queryParams
      this.page = params.page;
      this.filterOptions.isArchived = params.archive? params.archive!='false' : null
      this.filterOptions.sort = params.sort
      this.filterOptions.globalFilter = params.filter
      this.reloadMaps()
  }

  reloadMaps(fields = null, page = this.page, filter = this.filterOptions) {
    this.updateUrl()
    this.mapsService.filterMaps(fields, page, filter).subscribe(this.onDataLoad);
  }

  ngOnDestroy() {
    this.filterKeyUpSubscribe.unsubscribe();
  }

  
  updateUrl(page=this.page): void {
    this.router.navigate(['maps'], { queryParams:  { archive: this.filterOptions.isArchived, page: page, sort: this.filterOptions.sort, filter: this.filterOptions.globalFilter} });
  }
  
  clearSearchFilter(){
    this.filterOptions.globalFilter = undefined;
    this.loadMapsLazy()
    this.updateUrl()
  }


  loadMapsLazy(event?) {
    let fields, page;
    if (event) {
      fields = event.filters || null;
      page = event.first / 15 + 1;
      if (event.sortField) {
        this.filterOptions.sort = event.sortOrder === -1 ? '-' + event.sortField : event.sortField;
      }
    }
    if(this.isInit){
      this.isInit=false;
      return;
    }
    this.reloadMaps(fields, page, this.filterOptions)
  }

  deleteMap(id) {

    this.mapsService.delete(id).subscribe(() => {
      for (let i = 0, lenght = this.recentMaps.length; i < lenght; i++) {
        if (this.recentMaps[i]._id == id) {
          this.recentMaps.splice(i, 1);
          break;
        }
      }
      this.loadMapsLazy();
    });
  }


  onDataLoad(data) {
    if (!data) {
      this.maps = null;
      this.resultCount = 0;
      return;
    };
    this.maps = data.items;
    this.resultCount = data.totalCount;
  }


  onConfirmDelete(id) {
    // will be triggered by deactivate guard
    let confirm ='Delete';
    this.popupService.openConfirm(null,'Are you sure you want to delete? all data related to the map will get permanently lost',confirm,'Cancel',null)
    .subscribe(ans => {
      if (ans === confirm) {
        this.deleteMap(id);
      }
    })

  }
}