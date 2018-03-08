import { Component, OnDestroy, OnInit } from '@angular/core';

import 'rxjs/operators/take';

import { MapsService } from '../maps.service';
import { Map } from '../models/map.model';

@Component({
  selector: 'app-maps-list',
  templateUrl: './maps-list.component.html',
  styleUrls: ['./maps-list.component.scss']
})
export class MapsListComponent implements OnInit, OnDestroy {
  maps: Map[];
  mapReq: any;
  filterTerm: string;
  resultCount: number = 0;
  page: number = 1;
  featuredMaps: Map[];

  constructor(private mapsService: MapsService) {
    this.onDataLoad = this.onDataLoad.bind(this);
  }

  ngOnInit() {
    this.mapReq = this.mapsService.filterMaps(null, null, this.page).subscribe(this.onDataLoad);
    this.mapsService.filterMaps(null, '-createdAt', this.page).take(1).subscribe(data => {
      if (data)
        this.featuredMaps = data.items.slice(0, 4);
    });
  }

  ngOnDestroy() {
    this.mapReq.unsubscribe();
  }

  loadProjectLazy(event) {
    let fields, page, sort;
    if (event) {
      fields = event.filters || null;
      page = event.first / 15 + 1;
      if (event.sortField) {
        sort = event.sortOrder === -1 ? '-' + event.sortField : event.sortField;
      }
    }
    this.mapReq = this.mapsService.filterMaps(fields, sort, page, this.filterTerm).subscribe(this.onDataLoad);
  }

  onDataLoad(data){
    if (!data) return;
    this.maps = data.items;
    this.resultCount = data.totalCount;
  }

}


