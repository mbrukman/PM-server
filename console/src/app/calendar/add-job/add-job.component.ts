import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { ProjectsService } from '@projects/projects.service';
import { Project } from '@projects/models/project.model';
import { CalendarService } from '../calendar.service';
import { CronJobsConfig } from 'ngx-cron-jobs/src/app/lib/contracts/contracts';
import { MapsService } from '@maps/maps.service';

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
  cronConfig: CronJobsConfig = {
    multiple: false,
    quartz: false,
    bootstrap: true
  };


  constructor(private calendarService: CalendarService, private projectsService: ProjectsService, private mapsService: MapsService) {
  }

  ngOnInit() {
    this.projectsReq = this.projectsService.filter().subscribe(data => {
      this.projects = data.items;
    });
    this.form = this.initForm();
  }

  onSelectProject() {
    const projectId = this.form.controls.project.value;
    this.projectsService.detail(projectId,{isArchived:false,globalFilter:null}).subscribe(project => {
      this.selectedProject = project;
    });

  }

  /**
   * Invoked when a map selected. Send a request for map structure and set the selectedMapConfiguration.
   */
  onSelectMap() {
    const mapId = this.form.controls.map.value;
    this.mapsService.getMapStructure(mapId)
      .filter(structure => !!structure)
      .filter(structure => !!structure.configurations)
      .subscribe(structure => {
        this.selectedMapConfigurations = structure.configurations.map(o => o.name);
      });
  }

  initForm(): FormGroup {
    return new FormGroup({
      project: new FormControl(null, Validators.required),
      map: new FormControl(null, Validators.required),
      type: new FormControl('once', Validators.required),
      configuration: new FormControl(null),
      datetime: new FormControl(null),
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
