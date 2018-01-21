import { Injectable } from '@angular/core';
import { Subject } from "rxjs/Subject";
import { Observable } from "rxjs/Observable";

@Injectable()
export class MapDesignService {
  public dropped: Subject<any> = new Subject<any>();
  public onDrop: boolean;
  public tabOpen: boolean;

  constructor() {  }

  drop(x, y, cell) {
    this.dropped.next({x: x, y: y, cell: cell});
  }

  getDrop(): Observable<{x: number, y: number, cell: any}> {
    return this.dropped.asObservable();
  }


}
