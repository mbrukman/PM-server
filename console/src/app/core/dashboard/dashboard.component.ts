import { Component, OnInit } from '@angular/core';
import { MapsService } from '../../maps/maps.service';
import {DistinctMapResult} from '@shared/model/distinct-map-result.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  executions: DistinctMapResult[];
  mode: string = 'grid';
  constructor(private mapsService: MapsService) {
  }

  ngOnInit() {
    this.mapsService.getDistinctMapExecutionsResult().subscribe(executions => {
      this.executions = executions;
    })
  }
}
