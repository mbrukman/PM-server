import { Component, OnDestroy, OnInit } from '@angular/core';
import 'rxjs/operators/take';
import { MapsService } from '../maps.service';
import { Map } from '../models/map.model';
import { ConfirmComponent } from '@shared/confirm/confirm.component';
import { BsModalService } from 'ngx-bootstrap/modal';
import { FilterOptions } from '@shared/model/filter-options.model'

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
  filterOptions : FilterOptions = new FilterOptions();

  constructor(private mapsService: MapsService,
    private modalService: BsModalService) {
    this.onDataLoad = this.onDataLoad.bind(this)
  }
  

  ngOnInit() {
    this.reloadMaps();
    this.mapsService.filterMaps(null,this.page,this.filterOptions).take(1).subscribe(data => {
      if (data)
        this.featuredMaps = data.items.slice(0,4);
    });
  }
  
  reloadMaps(fields=null,page=this.page,filter=this.filterOptions){
    this.mapReq = this.mapsService.filterMaps(fields,page,filter).subscribe(this.onDataLoad);
  }

  ngOnDestroy() {
    this.mapReq.unsubscribe();
  }

  loadProjectLazy(event?) {
    let fields, page, sort;
    if (event) {
      fields = event.filters || null;
      page = event.first / 15 + 1;
      if (event.sortField) {
        sort = event.sortOrder === -1 ? '-' + event.sortField : event.sortField;
      }
    }
    this.filterOptions.sort = sort
    this.reloadMaps(fields,page,this.filterOptions)
  }

  deleteMap(id) {

    this.mapsService.delete(id).subscribe(() => {
      for(let i =0,lenght=this.featuredMaps.length; i<lenght;i++){
        if(this.featuredMaps[i].id == id){
          this.featuredMaps.splice(i,1);
          break;
        }
      }
      this.loadProjectLazy();
    });
  }


  onDataLoad(data){
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
       confirm: 'Delete',
       cancel: 'Cancel'
     };
     modal.content.message = 'Are you sure you want to delete? all data related to the map will get permanently lost';
     modal.content.confirm = answers.confirm;
     modal.content.cancel = answers.cancel;
     modal.content.result.asObservable().subscribe(ans => {
         if (ans === answers.confirm) {
           this.deleteMap(id);
         }
      })
       
  }
}