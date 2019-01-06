import { Component, OnInit, Input } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'map-cards',
  templateUrl: './map-cards.component.html',
  styleUrls: ['./map-cards.component.scss']
})
export class  MapsCardsComponents implements OnInit {
  @Input('maps') items: any[];
  
  colorScheme = {
    domain: ['#42bc76', '#f85555', '#ebb936']
  };
  constructor(private router: Router, private route: ActivatedRoute) { }

  ngOnInit() {
  }


  goToProject($event, id){
    $event.stopPropagation();
    this.router.navigate([`/projects/${id}`], { relativeTo: this.route });
  }

}
