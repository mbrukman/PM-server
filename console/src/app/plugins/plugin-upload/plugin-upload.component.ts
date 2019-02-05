import { Component, OnInit } from '@angular/core';

import { BsModalRef } from 'ngx-bootstrap';
import { Subject } from 'rxjs';
import { finalize } from 'rxjs/operators'

import { PluginsService } from '../plugins.service';

@Component({
  selector: 'app-plugin-upload',
  templateUrl: './plugin-upload.component.html',
  styleUrls: ['./plugin-upload.component.scss']
})
export class PluginUploadComponent implements OnInit {
  uploading: boolean = false;
  public closing: Subject<any> = new Subject<any>();

  constructor(private pluginsService: PluginsService, public bsModalRef: BsModalRef) {
  }

  ngOnInit() {

  }


  onPluginSelect(event) {
    const files = event.target.files || event.srcElement.files;
    const file = files[0];
    if (!file) {
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    this.uploading = true;
    this.pluginsService.upload(formData).pipe(
      finalize(() => {
        this.uploading = false;
        this.onClose();
      })
    ).subscribe(res => {
          console.log(res);
        },
        error => {
          console.log(error);
        });
  }

  onClose() {
    this.closing.next();
    this.bsModalRef.hide();
  }

}
