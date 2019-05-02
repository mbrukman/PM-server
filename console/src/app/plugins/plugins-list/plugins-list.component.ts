import { Component, OnInit } from '@angular/core';
import { PluginsService } from '../plugins.service';
import { BsModalRef, BsModalService } from 'ngx-bootstrap';

import { Plugin } from '../models/plugin.model';
import { PluginUploadComponent } from '../plugin-upload/plugin-upload.component';

import {SeoService,PageTitleTypes} from '@app/seo.service';

@Component({
  selector: 'app-plugins-list',
  templateUrl: './plugins-list.component.html',
  styleUrls: ['./plugins-list.component.scss']
})
export class PluginsListComponent implements OnInit {
  plugins: Plugin[];
  filterTerm: string;

  constructor(private pluginsService: PluginsService, 
    private modalService: BsModalService,
    private seoService:SeoService) {
  }

  ngOnInit() {
    this.seoService.setTitle(PageTitleTypes.Plugins)
    this.requestPlugins();
  }

  requestPlugins() {
    this.pluginsService.list().subscribe(plugins => {
      this.plugins = plugins;
    });
  }

  deletePlugin(id, index) {
    this.pluginsService.delete(id).subscribe(() => {
      this.requestPlugins();
    });
  }

  onOpenModal() {
    let modal: BsModalRef;
    modal = this.modalService.show(PluginUploadComponent);
    modal.content.closing.subscribe(() => {
      this.requestPlugins();
    });
  }

}
