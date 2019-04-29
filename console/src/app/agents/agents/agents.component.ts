import { Component, OnInit } from '@angular/core';
import {SeoService} from '@app/seo.service';
@Component({
  selector: 'app-agents',
  templateUrl: './agents.component.html',
  styleUrls: ['./agents.component.scss']
})
export class AgentsComponent implements OnInit {

  constructor(private seoService:SeoService) {
  }

  ngOnInit() {
    this.seoService.setTitle(this.seoService.Agents)
  }

}
