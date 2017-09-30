const WorkspaceStorage = {

  async fetchWorkspace(workspaceId) {
    const key = `workspaces@${workspaceId}`;
    const results = await browser.storage.local.get(key);

    if (results[key]){
      const state = results[key];
      return new Workspace(workspaceId, state.name, state.hiddenTabs);
    } else {
      return null;
    }
  },

  async storeWorkspaceState(workspace) {
    const key = `workspaces@${workspace.id}`;
    await browser.storage.local.set({
      [key]: {
        name: workspace.name,
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
  constructor(id, name, hiddenTabs) {
    this.id = id;
    this.name = name;
    this.hiddenTabs = hiddenTabs;
  }

  static async create(windowId, name) {
    const workspace = new Workspace(Workspace.generateId(), name, []);
    await WorkspaceStorage.storeWorkspaceState(workspace);
    await WorkspaceStorage.registerWorkspaceToWindow(windowId, workspace);

    return workspace;
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
    const workspaces = await WorkspaceStorage.fetchWorkspacesForWindow(await BackgroundLogic.getCurrentWindowId());

    if (workspaces.length > 0){
      return workspaces;
    } else {
      const defaultWorkspace = await BackgroundLogic.createNewWorkspace("Workspace 1");

      return [defaultWorkspace];
    }
  },

  async createNewWorkspace(workspaceName){
    const windowId = await BackgroundLogic.getCurrentWindowId();
    console.log("Will create new workspace",workspaceName,"in window", windowId);
    return await Workspace.create(windowId, workspaceName);
  },

  async switchToWorkspace(workspaceId) {
    const tabs = await browser.tabs.query({
      pinned: false
    });

    tabs.forEach(tab => {
      console.log(tab);
    })
  },

/*
  async getCurrentTab() {
    const results = await browser.tabs.query({
      active: true,
      windowId: await BackgroundLogic.getCurrentWindowId()
    });

    return results[0];
  },

  async addCurrentTabToWorkspace(workspaceId) {
    const tab = await BackgroundLogic.getCurrentTab();

    BackgroundLogic.addTabToWorkspace(tab, workspaceId);
  },

  async addTabToWorkspace(tab, workspaceId) {
    console.log("Adding tab", tab, "to", workspaceId);
  }
*/

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
