import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

import { AgentsGroupFilter, Group } from '@agents/models/group.model';
import { Agent } from './models/agent.model';
import { Subject } from 'rxjs';
import { SocketService } from '@app/shared/socket.service';


@Injectable()
export class AgentsService {
  draggedItem: any;
  private updatedGroup: Subject<Group> = new Subject();
  private dragSubject: Subject<any> = new Subject<any>();
  private selectedGroupSubject: Subject<Group> = new Subject<Group>();
  private reEvaluateFilterSubject: Subject<Group> = new Subject<Group>();

  constructor(private http: HttpClient, private socketService: SocketService) {
    
    this.status().subscribe(res=>{ //TODO: remove after socket will update the status too.
      this.socketService.updateAgentsStatus(res)
    })
  }

  delete(agentId) {
    return this.http.delete(`api/agents/${agentId}`, { responseType: 'text' as 'json' });
  }

  list() {
    return this.http.get<[Agent]>(`api/agents`);
  }

  status() {
    return this.http.get<any>(`api/agents/status`);
  }

  update(agent) {
    return this.http.put<Agent>(`api/agents/${agent._id}`, agent);
  }

  /* groups */

  /**
   * Create a new group
   * @param {Group} group
   * @returns {Observable<Object>}
   */
  groupCreate(group: Group) {
    return this.http.post<Group>(`api/agents/groups/create`, group);
  }

  /**
   * Delete a group
   * @param {string} groupId
   * @returns {Observable<Object>}
   */
  groupDelete(groupId: string) {
    return this.http.delete<string>(`api/agents/groups/${groupId}`, { responseType: 'text' as 'json' });
  }

  deleteFilterFromGroup(groupId,index){
    return this.http.delete<Group>(`api/agents/groups/${groupId}/filters/${index}`);
  }

  /**
   * Get group detail
   * @param {string} groupId
   * @returns {Observable<Object>}
   */
  groupDetail(groupId: string) {
    return this.http.get<Group>(`api/agents/groups/${groupId}`);
  }

  /**
   * Get a list of groups
   * @returns {Observable<Object>}
   */
  groupsList() {
    return this.http.get<Group[]>(`api/agents/groups`);
  }

  /**
   * Add an agent or a list of agents to a group.
   * @param {string} groupId
   * @param {string[]} agentsIds
   */
  addAgentToGroup(groupId: string, agentsIds: string[]) {
    return this.http.put<Group>(`api/agents/groups/${groupId}/add-agent`, agentsIds);
  }

  /**
   * Set group filters as this list.
   * @param {string} groupId
   * @param {AgentsGroupFilter[]} filters
   * @returns {Observable<Object>}
   */
  addGroupFilters(groupId: string, filters: AgentsGroupFilter[]) {
    return this.http.post<Group>(`api/agents/groups/${groupId}/add-filters`, filters);
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
   * Passing next group to updated group subject
   * @param group
   */
  updateGroup(group: Group) {
    this.updatedGroup.next(group);
  }

  updateGroupToServer(group: Group){
    return this.http.put<Group>(`api/agents/groups/${group._id}`, group);
  }

  /**
   * Returns a group to updated group as observable
   * @returns {Observable<Group>}
   */
  getUpdateGroupAsObservable(): Observable<Group> {
    return this.updatedGroup.asObservable();
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
    return this.reEvaluateFilterSubject.asObservable();
  }

  /**
   * Removes an agent from a group. returns updated group
   * @param {string} agentId
   * @param {string} groupId
   */
  removeAgentFromGroup(agentId: string, groupId: string) {
    return this.http.post<Group>(`api/agents/groups/${groupId}/remove-agent`, { agentId });
  }

}
