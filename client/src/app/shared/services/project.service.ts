import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions, Response } from '@angular/http';

import { Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import { ConstsService } from './consts.service';
import { AuthenticationService } from './authentication.service';

@Injectable()
export class ProjectService {
  private serverUrl: string;
  public bJProjectsTree = new BehaviorSubject<any>(null);
  private user: any;

  constructor(private http: Http, public options: RequestOptions, private constsService: ConstsService, private authService: AuthenticationService) {
    console.log("PROJECTS SERVICE +++ HERE I AM");
    let headers = new Headers({ 'Content-Type': 'application/json', withCredentials: true });
    this.options.headers = headers;
    this.serverUrl = this.constsService.getServerUrl();

    this.user = this.authService.getCurrentUser();


    this.getJstreeProjectsByUser(this.user.id)
      .subscribe((tree) => {
        console.log("got tree");
        this.setCurrentProjectTree(tree);
      },
      (error) => console.log(error)
    )
      
  }

  addFolder(projectId, parentId, folderName) {
    return this.http.post(this.serverUrl + 'project/addFolder', { projectId: projectId, parentId: parentId, name: folderName }, this.options).map(this.extractData);
  }

  createProject(projectName) {
    return this.http.post(this.serverUrl + 'project/createProject', { name: projectName }, this.options).map(this.extractData);
  }

  deleteFolder(id) {
    return this.http.post(this.serverUrl + 'project/deleteFolder', { id: id }, this.options).map(this.extractData);
  }

  deleteProject(projectId) {
    return this.http.get(this.serverUrl + 'project/deleteProject/' + projectId, this.options).map(this.extractData);
  }

  getProjectById(projectId) {
    return this.http.get(this.serverUrl + 'project/getProjectById/' + projectId, this.options).map(this.extractData);
  }

  getJstreeProjectsByUser(userId) {
    return this.http.get(this.serverUrl + 'project/getJstreeProjectsByUser/' + userId, this.options).map(this.extractData);
  }

  getNode(id: any) {
    return this.http.get(this.serverUrl + 'project/node/'+id, this.options).map(this.extractData);
  }

  getCurrentProjectTree() {
    return this.bJProjectsTree;
  }
  
  getProjectsByUser(userId) {
    return this.http.get(this.serverUrl + 'project/getProjectByUser/' + userId, this.options).map(this.extractData);
  }
  
  setCurrentProjectTree(tree) {
    console.log("sending next tree", tree);
    this.bJProjectsTree.next(tree);
  }

  renameFolder(id, name) {
    return this.http.post(this.serverUrl + 'project/renameFolder', { id: id, name: name }, this.options).map(this.extractData);
  }

  updateProject(project) {
    //TODO: create rename function for projects at the server
  }

  private extractData(res: Response) {
    try {
      let body = res.json();
      return body || {};
    } catch (ex) {
      return {};
    }
  }
}
