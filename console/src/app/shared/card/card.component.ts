import { Component, OnInit, Input } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss']
})
export class CardComponent implements OnInit {
  @Input('items') items: any[];
  @Input('schema') schema: boolean = false;
  
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
