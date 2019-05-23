import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { BsModalRef } from 'ngx-bootstrap';
import { ProjectsService } from '@projects/projects.service';
import { mergeMap } from 'rxjs/operators';
import { environment } from '@env/environment';

@Component({
  templateUrl: './import-modal.component.html',
  styleUrls: ['./import-modal.component.scss']
})
export class ImportModalComponent {
  name: string;
  structure: any;
  error: string;
  projectId: string;

  constructor(private router: Router, public bsModalRef: BsModalRef, private projectsService: ProjectsService) {
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
    this.projectsService.createMap({ name: this.name, project: this.projectId }).pipe(
      mergeMap(map => this.projectsService.createMapStructure(map.id, this.structure))
    ).subscribe(structure => {
        this.router.navigate(['/maps', structure.map]);
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
