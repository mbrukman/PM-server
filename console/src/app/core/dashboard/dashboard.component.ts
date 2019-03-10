import { Component, OnInit } from '@angular/core';
import { MapsService } from '../../maps/maps.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  executions: any;
  mode: string = 'grid';
  constructor(private mapsService: MapsService) {
  }

  ngOnInit() {
    this.mapsService.getDistinctMapExecutionsResult().subscribe(executions => {
      this.executions = executions;
    })
  }
}
