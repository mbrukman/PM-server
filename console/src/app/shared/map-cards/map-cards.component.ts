import { Component, OnInit, Input } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ProcessResult } from '@app/maps/models';

@Component({
  selector: 'map-cards',
  templateUrl: './map-cards.component.html',
  styleUrls: ['./map-cards.component.scss']
})
export class  MapsCardsComponents implements OnInit {
  @Input('maps') items: any[];
  @Input ('showPieChart') showPieChart = true;
  colorScheme = {
    domain: ['#42bc76', '#f85555', '#ebb936']
  };
  constructor(private router: Router, private route: ActivatedRoute) { }

  results : ProcessResult[][] = [];

  ngOnInit() {
    if(this.items){
      for(let i=0,length=this.items.length;i<length;i++){
        this.results.push([]);
        Object.assign(this.items[i],this.items[i].map)
        for(let j=0,length = this.items[i].exec.agentsResults.length;j<length;j++){
          this.results[i].push(...this.items[i].exec.agentsResults[j].processes);
        }
      }
    }
  }

  goToProject($event, id){
    $event.stopPropagation();
    this.router.navigate([`/projects/${id}`], { relativeTo: this.route });
  }

}
