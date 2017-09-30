const WorkspaceStorage = {

  async fetchWorkspace(workspaceId) {
    const key = `workspaces@${workspaceId}`;
    const results = await browser.storage.local.get(key);

    if (results[key]){
      const state = results[key];
      return new Workspace(workspaceId, state.name, state.active, state.hiddenTabs);
    } else {
      return null;
    }
  },

  async storeWorkspaceState(workspace) {
    const key = `workspaces@${workspace.id}`;
    await browser.storage.local.set({
      [key]: {
        name: workspace.name,
        active: workspace.active,
        hiddenTabs: workspace.hiddenTabs
      }
    });
  },

  async fetchWorkspacesForWindow(windowId) {
    const key = `windows@${windowId}`;
    const results = await browser.storage.local.get(key);

    const workspaceIds = results[key] || [];
    const promises = workspaceIds.map(async workspaceId => {
      return await WorkspaceStorage.fetchWorkspace(workspaceId);
    });

    return await Promise.all(promises);
  },

  async registerWorkspaceToWindow(windowId, workspace) {
    const key = `windows@${windowId}`;
    const results = await browser.storage.local.get(key);
    const workspacesForWindow = results[key] || [];

    workspacesForWindow.push(workspace.id);
    await browser.storage.local.set({
      [key]: workspacesForWindow
    });
  }

}

class Workspace {
  constructor(id, name, active, hiddenTabs) {
    this.id = id;
    this.name = name;
    this.active = active;
    this.hiddenTabs = hiddenTabs;
  }

  static async create(windowId, name, active) {
    const workspace = new Workspace(Workspace.generateId(), name, active || false, []);
    await WorkspaceStorage.storeWorkspaceState(workspace);
    await WorkspaceStorage.registerWorkspaceToWindow(windowId, workspace);

    return workspace;
  }

  async hide(windowId){
    const tabs = await browser.tabs.query({
      windowId: windowId,
      pinned: false
    });

    // Store hidden status in storage
    tabs.forEach(tab => {
      const tabObject = Object.assign({}, tab);
      // tabObject.active = false;
      // tabObject.hiddenState = true;

      this.hiddenTabs.push(tabObject);
    })

    this.active = false;
    await WorkspaceStorage.storeWorkspaceState(this);

    // Then remove the tags from the window
    const tabIds = tabs.map(tab => tab.id);
    browser.tabs.remove(tabIds);
  }

  async show(windowId){
    const promises = this.hiddenTabs.map(tabObject => {
      return browser.tabs.create({
        url: tabObject.url,
        active: tabObject.active,
        windowId: windowId
      });
    });

    await Promise.all(promises);

    this.hiddenTabs = [];
    this.active = true;
    await WorkspaceStorage.storeWorkspaceState(this);
  }

  static generateId() {
    // UUIDv4 from https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    )
  }
}



const BackgroundLogic = {

  async getWorkspacesForCurrentWindow(){
    return await BackgroundLogic.getWorkspacesForWindow(await BackgroundLogic.getCurrentWindowId());
  },

  async getWorkspacesForWindow(windowId){
    const workspaces = await WorkspaceStorage.fetchWorkspacesForWindow(windowId);

    if (workspaces.length > 0){
      return workspaces;
    } else {
      const defaultWorkspace = await BackgroundLogic.createNewWorkspace("Workspace 1", true);

      return [defaultWorkspace];
    }
  },

  async getCurrentWorkspaceForWindow(windowId) {
    const workspaces = await BackgroundLogic.getWorkspacesForWindow(windowId);

    return workspaces.filter(workspace => workspace.active)[0];
  },

  async createNewWorkspace(workspaceName, active){
    const windowId = await BackgroundLogic.getCurrentWindowId();

    const workspace = await Workspace.create(windowId, workspaceName, active || false);
    BackgroundLogic.switchToWorkspace(workspace.id);
  },

  async switchToWorkspace(workspaceId) {
    const windowId = await BackgroundLogic.getCurrentWindowId();

    const oldWorkspace = await BackgroundLogic.getCurrentWorkspaceForWindow(windowId);
    const newWorkspace = await WorkspaceStorage.fetchWorkspace(workspaceId);

    if (oldWorkspace.id == newWorkspace.id){
      // Nothing to do here
      return;
    }

    oldWorkspace.hide(windowId);
    newWorkspace.show(windowId);
  },

  async getCurrentWindowId() {
    const currentWindow = await browser.windows.getCurrent();

    return currentWindow.id;
  }

};

browser.runtime.onMessage.addListener((m) => {
  let response;

  switch (m.method) {
    case "getWorkspacesForCurrentWindow":
      response = BackgroundLogic.getWorkspacesForCurrentWindow();
      break;
    case "switchToWorkspace":
      BackgroundLogic.switchToWorkspace(m.workspaceId);
      break;
    case "createNewWorkspace":
      BackgroundLogic.createNewWorkspace(m.workspaceName);
      break;
  }

  return response;
});
