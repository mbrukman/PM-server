import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import {Map} from '@maps/models/map.model'
import { ProjectsService } from '@projects/projects.service';
import { Project } from '@projects/models/project.model';
import { CalendarService } from '../calendar.service';
import { CronJobsConfig } from 'ngx-cron-jobs/src/app/lib/contracts/contracts';
import { MapsService } from '@maps/maps.service';
import { FilterOptions } from '@shared/model/filter-options.model';
import { filter } from 'rxjs/operators';
import { SelectItem } from 'primeng/primeng';

@Component({
  selector: 'app-add-job',
  templateUrl: './add-job.component.html',
  styleUrls: ['./add-job.component.scss']
})
export class AddJobComponent implements OnInit {
  selectedMapConfigurations: string[];
  projects: Project[];
  selectedProject: Project;
  projectsReq: any;
  form: FormGroup;
  cron: any;
  projectsDropDown:SelectItem[];
  configurationsDropDown:SelectItem[];
  mapDropDown=[];
  cronConfig: CronJobsConfig = {
    multiple: false,
    quartz: false,
    bootstrap: true
  };


  constructor(private calendarService: CalendarService, private projectsService: ProjectsService, private mapsService: MapsService) {
  }

  ngOnInit() {
    var filterOptions : FilterOptions = {isArchived:false,globalFilter:null,sort:'-createdAt'};
    this.projectsReq = this.projectsService.filter(null,null,filterOptions).subscribe(data => {
      this.projects = data.items;
      this.projectsDropDown = this.projects.map(project => {
        return {label:project.name,value:project._id}
      })
    });
    this.form = this.initForm();
    
    let cronControl = this.form.get('cron');
    let datetimeControl = this.form.get('datetime');
    this.form.get('type').valueChanges.subscribe(type=>{
      if(type=='once') {
        datetimeControl.setValidators([Validators.required]);
        cronControl.setValidators(null);
      } else {
        datetimeControl.setValidators(null);
        cronControl.setValidators([Validators.required]);
      }
      cronControl.updateValueAndValidity();
      datetimeControl.updateValueAndValidity();
    })
  }

  onSelectProject() {
    this.mapDropDown = [];
    const projectId = this.form.controls.project.value;
    this.projectsService.detail(projectId,{isArchived:false,globalFilter:null,sort:'-createdAt'}).subscribe(project => {
      this.selectedProject = project;
      for(let i =0,length=this.selectedProject.maps.length;i<length;i++){
        let map = <Map>(this.selectedProject.maps[i]);
        this.mapDropDown.push({label:map.name,value:map._id})
      }
    });

  }

  /**
   * Invoked when a map selected. Send a request for map structure and set the selectedMapConfiguration.
   */
  onSelectMap() {
    const mapId = this.form.controls.map.value;
    this.mapsService.getMapStructure(mapId).pipe(
      filter(structure => !!structure && !!structure.configurations),
    ).subscribe(structure => {
        this.selectedMapConfigurations = structure.configurations.map(o => o.name);
        this.configurationsDropDown = this.selectedMapConfigurations.map(config => {
          return {label:config,value:config}
        })
      });
  }

  initForm(): FormGroup {
    return new FormGroup({
      project: new FormControl(null, Validators.required),
      map: new FormControl(null, Validators.required),
      type: new FormControl('once', Validators.required),
      configuration: new FormControl(null),
      datetime: new FormControl(null,  Validators.required),
      cron: new FormControl(null)
    });
  }

  onSubmit(form) {
    form.type === 'once' ? form.cron = null :  form.datetime = null; 
    this.calendarService.create(form.map, form).subscribe(job => {
      this.calendarService.setNewJob(job);
    });
  }

  updateCron() {
    this.form.controls.cron.setValue(this.cron);
  }

}
