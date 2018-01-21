import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { ProjectsService } from '../../projects/projects.service';
import { Project } from '../../projects/models/project.model';
import { CalendarService } from '../calendar.service';
import { CronJobsConfig } from 'ngx-cron-jobs/src/app/lib/contracts/contracts';

@Component({
  selector: 'app-add-job',
  templateUrl: './add-job.component.html',
  styleUrls: ['./add-job.component.scss']
})
export class AddJobComponent implements OnInit {
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


  constructor(private calendarService: CalendarService, private projectsService: ProjectsService) {
  }

  ngOnInit() {
    this.projectsReq = this.projectsService.filter().subscribe(data => {
      this.projects = data.items;
    });
    this.form = this.initForm();
  }

  onSelectProject() {
    const projectId = this.form.controls.project.value;
    this.projectsService.detail(projectId).subscribe(project => {
      this.selectedProject = project;
    });

  }

  initForm(): FormGroup {
    return new FormGroup({
      project: new FormControl(null, Validators.required),
      map: new FormControl(null, Validators.required),
      type: new FormControl('once', Validators.required),
      datetime: new FormControl(null),
      cron: new FormControl(null)
    });
  }

  onSubmit(form) {
    this.calendarService.create(form.map, form).subscribe(job => {
      console.log(job);
      this.calendarService.setNewJob(job);
    });
  }

  updateCron() {
    this.form.controls.cron.setValue(this.cron);
  }

}
