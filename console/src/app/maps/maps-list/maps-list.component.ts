import { Component, OnDestroy, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Subscription, Observable } from 'rxjs';
import * as _ from 'lodash';
import { MapsService } from '../maps.service';
import { Map } from '../models/map.model';
import { ConfirmComponent } from '@shared/confirm/confirm.component';
import { BsModalService } from 'ngx-bootstrap/modal';
import { FilterOptions } from '@shared/model/filter-options.model'
import { fromEvent } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { DistinctMapResult } from '@shared/model/distinct-map-result.model';
import { Data, ActivatedRoute } from '@angular/router';

import {SeoService,PageTitleTypes} from '@app/seo.service';

@Component({
  selector: 'app-maps-list',
  templateUrl: './maps-list.component.html',
  styleUrls: ['./maps-list.component.scss']
})
export class MapsListComponent implements OnInit, OnDestroy {
  maps: Map[];
  mapReq: Subscription;
  resultCount: number = 0;
  page: number = 1;
  filterOptions: FilterOptions = new FilterOptions();
  recentMaps: DistinctMapResult[];
  filterKeyUpSubscribe: Subscription;


  @ViewChild('globalFilter') globalFilterElement: ElementRef;

  constructor(private mapsService: MapsService,
    private modalService: BsModalService,
    private route: ActivatedRoute,
    private seoService:SeoService) {
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
  }

  reloadMaps(fields = null, page = this.page, filter = this.filterOptions) {
    this.mapReq = this.mapsService.filterMaps(fields, page, filter).subscribe(this.onDataLoad);
  }

  ngOnDestroy() {
    this.mapReq.unsubscribe();
    this.filterKeyUpSubscribe.unsubscribe();
  }

  clearSearchFilter(){
    this.filterOptions.globalFilter = undefined;
    this.loadMapsLazy()
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
    this.reloadMaps(fields, page, this.filterOptions)
  }

  deleteMap(id) {

    this.mapsService.delete(id).subscribe(() => {
      for (let i = 0, lenght = this.recentMaps.length; i < lenght; i++) {
        if (this.recentMaps[i].id == id) {
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
    let modal = this.modalService.show(ConfirmComponent);
    let answers = {
      third: 'Delete',
      cancel: 'Cancel'
    };
    modal.content.message = 'Are you sure you want to delete? all data related to the map will get permanently lost';
    modal.content.third = answers.third;
    modal.content.confirm = null;
    modal.content.cancel = answers.cancel;
    modal.content.result.asObservable().subscribe(ans => {
      if (ans === answers.third) {
        this.deleteMap(id);
      }
    })

  }
}