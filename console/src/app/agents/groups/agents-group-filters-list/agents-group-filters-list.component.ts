import {Component, OnInit, Input, OnDestroy} from '@angular/core';
import {PopupService} from '@shared/services/popup.service';
import {AgentsService} from '@app/services/agent/agents.service';
import {Group} from '@agents/models';
import {AgentsGroupUpsertFilterComponent} from '@agents/groups/agents-group-upsert-filter/agents-group-upsert-filter.component';
import {FILTER_FIELDS} from '@agents/models/group.model';
import {switchMap, take, tap} from 'rxjs/operators';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-agents-group-filters-list',
  templateUrl: './agents-group-filters-list.component.html',
  styleUrls: ['./agents-group-filters-list.component.scss']
})
export class AgentsGroupFiltersListComponent implements OnInit, OnDestroy {
  fields = FILTER_FIELDS;
  items: any[];
  private mainSubscription = new Subscription();
  @Input('group') group: Group;

  constructor(private agentsService: AgentsService, private popupService: PopupService) {
  }

  ngOnInit() {
    const updateGroupSubscription = this.agentsService.getUpdateGroupAsObservable()
      .subscribe((group) => {
        this.group = group;
      });
    this.mainSubscription.add(updateGroupSubscription);
  }

  getLabelById(type, id) {
    return this[type][this[type]
      .findIndex(type => type.id === id)].label;
  }

  editFilter(filter, index) {
    let content = {
      edit: true,
      filter: filter
    };
    const editFilterSubscription = this.popupService.openComponent(AgentsGroupUpsertFilterComponent, content)
      .pipe(
        take(1),
        tap((filters: any) => this.group.filters.splice(index, 1, filters)),
        switchMap(() => this.agentsService.updateGroupToServer(this.group))
      ).subscribe(group => this.agentsService.updateGroup(group));
    this.mainSubscription.add(editFilterSubscription);
  }

  deleteFilter(index) {
    const deleteFilterSubscription = this.agentsService
      .deleteFilterFromGroup(this.group.id, index)
      .subscribe(group => this.agentsService.updateGroup(group));
    this.mainSubscription.add(deleteFilterSubscription);
  }

  ngOnDestroy() {
    this.mainSubscription.unsubscribe();
  }

}
