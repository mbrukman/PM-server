import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { ProjectsService } from '../projects.service';
import { Project } from '../models/project.model';

@Component({
  selector: 'app-project-create',
  templateUrl: './project-create.component.html',
  styleUrls: ['./project-create.component.scss']
})
export class ProjectCreateComponent implements OnInit, OnDestroy {
  projectForm: FormGroup;
  project: Project;
  queryParamsReq : Subscription

  constructor(private projectsService: ProjectsService, private router: Router, private route: ActivatedRoute) {
  }

  ngOnInit() {
    this.queryParamsReq = this.route.queryParams.subscribe(params => {
      console.log(params);
      if (params && params.project) {
        this.projectsService.detail(params.project).subscribe(project => {
          this.project = project;
          this.setFormData({ name: project.name, description: project.description });
        });
      }
    });
    this.initProjectForm();
  }

  initProjectForm() {
    this.projectForm = new FormGroup({
      name: new FormControl(null, Validators.required),
      description: new FormControl(),
    });
  }

  setFormData(data: { name: string, description: string }) {
    this.projectForm.setValue({ name: data.name || null, description: data.description || null });
  }

  onSubmitForm(form: Project) {
    if (this.project) {
      this.projectsService.update(this.project._id, form).subscribe((project) => {
        this.router.navigate(['/projects', project.id]);
      });
    } else {
      this.projectsService.create(form).subscribe(project => {
        this.router.navigate(['/projects', project.id]);
      });
    }

  }

  ngOnDestroy() {
    this.queryParamsReq.unsubscribe();
  }

}
