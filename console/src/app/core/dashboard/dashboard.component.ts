import { Component, OnInit } from '@angular/core';
import { MapsService } from '../../maps/maps.service';
import {DistinctMapResult} from '@shared/model/distinct-map-result.model';
import { ProcessResult } from '@app/maps/models';
import { Title }     from '@angular/platform-browser';
import {SeoService} from '@app/seo.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  executions: DistinctMapResult[];
  results : ProcessResult[][] = [];
  mode: string = 'grid';
  constructor(private mapsService: MapsService,
    private titleService: Title,
    private seoService:SeoService) {
  }

  ngOnInit() {
    this.titleService.setTitle(this.seoService.Dashboard)
    this.mapsService.getDistinctMapExecutionsResult().subscribe(executions => {
      this.executions = executions;
      if(this.executions){
        for(let i=0,length=this.executions.length;i<length;i++){
          this.results.push([]);
          for(let j=0,length = this.executions[i].exec.agentsResults.length;j<length;j++){
            this.results[i].push(...this.executions[i].exec.agentsResults[j].processes);
          }
        }
      }
    })
  }
}
