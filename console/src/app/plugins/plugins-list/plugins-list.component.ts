import { Component, OnDestroy, OnInit } from '@angular/core';
import { PluginsService } from '../plugins.service';
import { BsModalRef, BsModalService } from 'ngx-bootstrap';

import { Plugin } from '../models/plugin.model';
import { PluginUploadComponent } from '../plugin-upload/plugin-upload.component';

@Component({
  selector: 'app-plugins-list',
  templateUrl: './plugins-list.component.html',
  styleUrls: ['./plugins-list.component.scss']
})
export class PluginsListComponent implements OnInit, OnDestroy {
  plugins: [Plugin];
  pluginsReq: any;
  filterTerm: string;

  constructor(private pluginsService: PluginsService, private modalService: BsModalService) {
  }

  ngOnInit() {
    this.requestPlugins();
  }

  requestPlugins() {
    this.pluginsReq = this.pluginsService.list().subscribe(plugins => {
      this.plugins = plugins;
    });
  }

  ngOnDestroy() {
    this.pluginsReq.unsubscribe();
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
