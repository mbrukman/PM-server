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
  filterOptions: FilterOptions = new FilterOptions();
  recentMaps: DistinctMapResult[];
  filterKeyUpSubscribe: Subscription;
  isInit:boolean=true;

  readonly tablePageSize = 15;

  @ViewChild('globalFilter') globalFilterElement: ElementRef;

  constructor(private mapsService: MapsService,
    private popupService: PopupService,
    private route: ActivatedRoute,
    private seoService:SeoService,
    private readonly router: Router) {
    this.onDataLoad = this.onDataLoad.bind(this)
  }


  ngOnInit() {
    this.filterOptions = this._getObjectFrom(this.route.snapshot.queryParams)
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

  }

  reloadMaps(fields = null, filter = this.filterOptions) {
    this.updateUrl()
    this.mapsService.filterMaps(fields, filter).subscribe(this.onDataLoad);
  }

  ngOnDestroy() {
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
    let data = this._getObjectFrom(this.filterOptions)
        
    this.router.navigate(['maps'], { queryParams: data});
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
      page = (event.first / this.tablePageSize) + 1;
      if (event.sortField) {
        this.filterOptions.sort = event.sortOrder === -1 ? '-' + event.sortField : event.sortField;
      }
    }
    if(this.isInit){
      this.isInit=false;
      return;
    }
    this.filterOptions.page = page
    this.reloadMaps(fields, this.filterOptions)
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