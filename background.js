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

  async registerWorkspaceToWindow(windowId, workspace) {
    const key = `windows@${windowId}`;
    const results = await browser.storage.local.get(key);
    const workspacesForWindow = results[key] || [];

    workspacesForWindow.push(workspace.id);
    await browser.storage.local.set({
      key: workspacesForWindow
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



const backgroundLogic = {
  // TODO
  async getWorkspacesForCurrentWindow(){
    return Promise.resolve([
      new Workspace("Workspace 1"),
      new Workspace("Workspace 2"),
      new Workspace("Workspace 3"),
    ]);
  },

  async getCurrentTab() {
    const results = await browser.tabs.query({
      active: true,
      windowId: browser.windows.WINDOW_ID_CURRENT
    });

    return results[0];
  },

  async addCurrentTabToWorkspace(workspaceId) {
    const tab = await backgroundLogic.getCurrentTab();

    backgroundLogic.addTabToWorkspace(tab, workspaceId);
  },

  async addTabToWorkspace(tab, workspaceId) {
    console.log("Adding tab", tab, "to", workspaceId);
  },

  async switchToWorkspace(workspaceId) {
    const tabs = await browser.tabs.query({
      pinned: false
    });

    tabs.forEach(tab => {
      console.log(tab);
    })
  },

  async createNewWorkspace(workspaceName){
    windowId = (await browser.windows.getCurrent()).id;
    console.log("Will create new workspace",windowId,workspaceName);
    const ws = await Workspace.create(windowId, workspaceName);
    console.log(ws);
  }
};

browser.runtime.onMessage.addListener((m) => {
    switch (m.method) {
      case "addCurrentTabToWorkspace":
        backgroundLogic.addCurrentTabToWorkspace(m.workspaceId);
        break;
      case "switchToWorkspace":
        backgroundLogic.switchToWorkspace(m.workspaceId);
        break;
      case "createNewWorkspace":
        backgroundLogic.createNewWorkspace(m.workspaceName);
        break;
    }
});
