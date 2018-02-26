import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';

import { Observable } from 'rxjs/Observable';

import { FilterParam, Group } from '@agents/models/group.model';
import { Agent } from './models/agent.model';
import { Subject } from 'rxjs/Subject';

const serverUrl = environment.serverUrl;

@Injectable()
export class AgentsService {
  draggedItem: any;
  private dragSubject: Subject<any> = new Subject<any>();
  private selectedGroupSubject: Subject<Group> = new Subject<Group>();
  private reEvaluateFilterSubject: Subject<Group> = new Subject<Group>();

  constructor(private http: HttpClient) {
  }

  delete(agentId) {
    return this.http.delete(serverUrl + 'api/agents/' + agentId + '/delete', { responseType: 'text' as 'json' })
  }

  list() {
    return this.http.get<[Agent]>(serverUrl + 'api/agents')
  }

  status() {
    return this.http.get<any>(serverUrl + 'api/agents/status')
  }

  update(agent) {
    return this.http.put<Agent>(serverUrl + 'api/agents/' + agent._id + '/update', agent);
  }

  /* groups */

  /**
   * Create a new group
   * @param {Group} group
   * @returns {Observable<Object>}
   */
  groupCreate(group: Group) {
    return this.http.post<Group>(`${serverUrl}api/agents/groups/create`, group);
  }

  /**
   * Delete a group
   * @param {string} groupId
   * @returns {Observable<Object>}
   */
  groupDelete(groupId: string) {
    return this.http.delete<string>(`${serverUrl}api/agents/groups/${groupId}/delete`, { responseType: 'text' as 'json' });
  }

  /**
   * Get group detail
   * @param {string} groupId
   * @returns {Observable<Object>}
   */
  groupDetail(groupId: string) {
    return this.http.get<Group>(`${serverUrl}api/agents/groups/${groupId}`)
  }

  /**
   * Get a list of groups
   * @returns {Observable<Object>}
   */
  groupsList() {
    return this.http.get<Group[]>(`${serverUrl}api/agents/groups`);
  }

  /**
   * Add an agent or a list of agents to a group.
   * @param {string} groupId
   * @param {string[]} agentsIds
   */
  addAgentToGroup(groupId: string, agentsIds: string[]) {
    return this.http.put<Group>(`${serverUrl}api/agents/groups/${groupId}/add-agent`, agentsIds);
  }

  /**
   * Set group filters as this list.
   * @param {string} groupId
   * @param {[FilterParam]} filters
   * @returns {Observable<Object>}
   */
  addGroupFilters(groupId: string, filters: [FilterParam]) {
    return this.http.post<Group>(`${serverUrl}api/agents/groups/${groupId}/add-filters`, filters);
  }

  /**
   * When drag event in agent list starts setting the draggedItem to this item and emitting it to the dragSubject.
   * @param item
   */
  dragStart(item) {
    this.draggedItem = item;
    this.dragSubject.next(item);
  }

  /**
   * Returning the dragSubject as an observable
   * @returns {Observable<any>}
   */
  getDragAsObservable() {
    return this.dragSubject.asObservable();
  }

  /**
   * Passing next group to observer
   * @param {Group} group
   */
  selectGroup(group: Group) {
    this.selectedGroupSubject.next(group);
  }

  /**
   * Returns observable of selected group
   * @returns {Observable<Group>}
   */
  getSelectedGroupAsObservable(): Observable<Group> {
    return this.selectedGroupSubject.asObservable();
  }

  /**
   * Passing next group to the reevabluate subject
   * @param group
   */
  reEvaluateGroupFilters(group) {
    this.reEvaluateFilterSubject.next(group);
  }

  /**
   * Returns a group to reevavluate the filter as observable
   * @returns {Observable<Group>}
   */
  getGroupToReEvaluateAsObservable(): Observable<Group> {
    return this.reEvaluateFilterSubject.asObservable()
  }

}
