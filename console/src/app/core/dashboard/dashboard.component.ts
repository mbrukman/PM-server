import { Component, OnInit } from '@angular/core';
import {DistinctMapResult} from '@shared/model/distinct-map-result.model';
import { ProcessResult } from '@app/maps/models';
import { Data, ActivatedRoute } from '@angular/router';
import {SeoService,PageTitleTypes} from '@app/seo.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  executions: DistinctMapResult[];
  results : ProcessResult[][] = [];
  mode: string = 'grid';
  constructor(
    private route : ActivatedRoute,
    private seoService:SeoService) {
  }

  ngOnInit() {
    this.seoService.setTitle(PageTitleTypes.Dashboard)
    this.route.data.subscribe((data: Data) => {
      let executions = data['mapsResult'];
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
