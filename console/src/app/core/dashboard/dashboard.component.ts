import {Component, OnDestroy, OnInit} from '@angular/core';
import {DistinctMapResult} from '@shared/model/distinct-map-result.model';
import {ProcessResult} from '@app/maps/models';
import {Data, ActivatedRoute} from '@angular/router';
import {SeoService, PageTitleTypes} from '@app/seo.service';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  executions: DistinctMapResult[];
  results: ProcessResult[][] = [];
  mode: string = 'grid';

  private mainSubscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private seoService: SeoService) {
  }

  ngOnInit() {
    this.seoService.setTitle(PageTitleTypes.Dashboard);

    const routeDataSubscription = this.route.data.subscribe((data: Data) => {
      this.executions = data['dashboardItems'];
      if (this.executions) {
        for (let i = 0, length = this.executions.length; i < length; i++) {
          this.results.push([]);
          for (let j = 0, innerLength = this.executions[i].exec.agentsResults.length; j < innerLength; j++) {
            this.results[i].push(...this.executions[i].exec.agentsResults[j].processes);
          }
        }
      }
    });

    this.mainSubscription.add(routeDataSubscription);
  }

  ngOnDestroy(): void {
    this.mainSubscription.unsubscribe();
  }
}
