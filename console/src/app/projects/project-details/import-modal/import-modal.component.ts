import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { BsModalRef } from 'ngx-bootstrap';
import { ProjectsService } from '@projects/projects.service';
import { mergeMap } from 'rxjs/operators';
import { environment } from '@env/environment';
import { MapsService } from '@app/maps/maps.service';

@Component({
  templateUrl: './import-modal.component.html',
  styleUrls: ['./import-modal.component.scss']
})
export class ImportModalComponent {
  name: string;
  structure: any;
  error: string;
  projectId: string;

  constructor(private router: Router, public bsModalRef: BsModalRef, private projectsService: ProjectsService, private mapsService:MapsService) {
  }

  onClose() {
    this.bsModalRef.hide();
  }

  fixImgUrl(){
    let startString = 'xlink:href\":\"' ;
    let endString = 'plugins/';
    let start = this.structure.content.indexOf(startString)
    let end = this.structure.content.indexOf(endString)
    let imgUrl = this.structure.content.slice(start,end)
    if(imgUrl ==  (startString + environment.serverUrl)){
      return
    }
    this.structure.content = this.structure.content.replace(new RegExp(imgUrl, 'g'), (startString + environment.serverUrl))
  }

  onConfirm() {
    if (!this.name || !this.structure) {
      this.error = 'All fields are required';
      return ;
    }
    this.fixImgUrl()
    this.mapsService.createMap({ name: this.name, project: this.projectId, structure:this.structure}).subscribe(map => {
        this.router.navigate(['/maps', map.id]);
        this.onClose();
      })
  }

  onUploadFile(event) {
    let file = event.target.files[0];
    if (file.name.slice(file.name.length - 4) !== 'json') {
      this.error = 'Please enter a json file';
      return;
    }
    let reader = new FileReader();
    reader.onload = () => {
      const text = reader.result;
      try {
        this.structure = JSON.parse(text.toString());
      } catch (e) {
        this.error = e;
        return
      }
    };
    reader.readAsText(file);
  }
}
