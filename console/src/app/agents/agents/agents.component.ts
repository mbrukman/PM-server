import { Component, OnInit } from '@angular/core';
import { Title }     from '@angular/platform-browser';
import {SeoService} from '@app/seo.service';
@Component({
  selector: 'app-agents',
  templateUrl: './agents.component.html',
  styleUrls: ['./agents.component.scss']
})
export class AgentsComponent implements OnInit {

  constructor(private titleService: Title,
    private seoService:SeoService) {
  }

  ngOnInit() {
    this.titleService.setTitle(this.seoService.Agents)
  }

}
