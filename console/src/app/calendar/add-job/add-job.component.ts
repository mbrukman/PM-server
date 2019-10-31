import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {ProjectsService} from '@projects/projects.service';
import {Project} from '@projects/models/project.model';
import {CalendarService} from '@app/services/calendar/calendar.service';
import {CronJobsConfig} from 'ngx-cron-jobs/src/app/lib/contracts/contracts';
import {MapsService} from '@app/services/map/maps.service';
import {FilterOptions} from '@shared/model/filter-options.model';
import {filter} from 'rxjs/operators';
import {SelectItem} from 'primeng/primeng';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-add-job',
  templateUrl: './add-job.component.html',
  styleUrls: ['./add-job.component.scss']
})
export class AddJobComponent implements OnInit, OnDestroy {
  private mainSubscription = new Subscription();
  selectedMapConfigurations: string[];
  projects: Project[];
  form: FormGroup;
  cron: any;
  projectsDropDown: SelectItem[];
  configurationsDropDown: SelectItem[];
  mapDropDown = [];
  cronConfig: CronJobsConfig = {
    multiple: false,
    quartz: false,
    bootstrap: true
  };


  constructor(private calendarService: CalendarService, private projectsService: ProjectsService, private mapsService: MapsService) {
  }

  ngOnInit() {
    const filterOptions: FilterOptions = {isArchived: false, globalFilter: null, sort: '-createdAt'};
    const projectsFilterSubscription = this.projectsService
      .filter(null, filterOptions)
      .subscribe(data => {
        this.projects = data.items;
        this.projectsDropDown = this.projects.map(project => {
          return {label: project.name, value: project._id};
        });
      });
    this.form = this.initForm();

    let cronControl = this.form.get('cron');
    let datetimeControl = this.form.get('datetime');
    const typeChangesSubscription = this.form
      .get('type')
      .valueChanges
      .subscribe(type => {
        if (type === 'once') {
          datetimeControl.setValidators([Validators.required]);
          cronControl.setValidators(null);
        } else {
          datetimeControl.setValidators(null);
          cronControl.setValidators([Validators.required]);
        }
        cronControl.updateValueAndValidity();
        datetimeControl.updateValueAndValidity();
      });

    this.mainSubscription.add(projectsFilterSubscription);
    this.mainSubscription.add(typeChangesSubscription);
  }

  onSelectProject() {
    this.mapDropDown = [];
    const projectId = this.form.controls.project.value;
    let filterOptions = new FilterOptions();
    filterOptions.filter = {};
    filterOptions.filter.projectId = projectId;
    const selectProjectSubscription = this.mapsService
      .filterMaps(null, filterOptions)
      .subscribe(maps => {
        for (let i = 0, length = maps.items.length; i < length; i++) {
          this.mapDropDown.push({label: maps.items[i].name, value: maps.items[i].id});
        }
      });
    this.mainSubscription.add(selectProjectSubscription);
  }

  /**
   * Invoked when a map selected. Send a request for map structure and set the selectedMapConfiguration.
   */
  onSelectMap() {
    const mapId = this.form.controls.map.value;
    const getMapSubscription = this.mapsService.getMapStructure(mapId)
      .pipe(
        filter(structure => !!structure && !!structure.configurations),
      ).subscribe(structure => {
        this.selectedMapConfigurations = structure.configurations.map(o => o.name);
        this.configurationsDropDown = this.selectedMapConfigurations.map(config => {
          return {label: config, value: config};
        });
      });

    this.mainSubscription.add(getMapSubscription);
  }

  initForm(): FormGroup {
    return new FormGroup({
      project: new FormControl(null, Validators.required),
      map: new FormControl(null, Validators.required),
      type: new FormControl('once', Validators.required),
      configuration: new FormControl(null),
      datetime: new FormControl(null, Validators.required),
      cron: new FormControl(null)
    });
  }

  onSubmit(form) {
    if (form.type === 'once') {
      form.cron = null;
    } else {
      form.datetime = null;
    }

    const submitSubscription = this.calendarService.create(form.map, form)
      .subscribe(job => {
        this.calendarService.setNewJob(job);
      });

    this.mainSubscription.add(submitSubscription);
  }

  updateCron() {
    this.form.controls.cron.setValue(this.cron);
  }

  ngOnDestroy(): void {
    this.mainSubscription.unsubscribe();
  }

}
