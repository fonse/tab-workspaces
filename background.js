class Workspace {
  constructor(id, name, hiddenTabs) {
    this.id = id;
    this.name = name;
    this.hiddenTabs = hiddenTabs;
  }

  async save() {
    const workspaceKey = `workspaces@${this.id}`;
    await browser.storage.local.set({
      [workspaceKey]: {
        name: this.name,
        hiddenTabs: this.hiddenTabs
      }
    });

    // TODO Replace with current window
    const windowKey = "window@todo";
    const results = await browser.storage.local.get(windowKey);
    const workspacesForWindow = results[windowKey] || [];

    workspacesForWindow.push(this.id);
    await browser.storage.local.set({
      windowKey: workspacesForWindow
    });
  }

  static async create(name) {
    const workspace = new Workspace(Workspace.generateId(), name, []);
    await workspace.save();

    return workspace;
  }

  static async find(id) {
    const key = `workspaces@${id}`;
    const results = await browser.storage.local.get(key);

    if (results[key]){
      const state = results[key];
      return new Workspace(id, state.name, state.hiddenTabs);
    } else {
      return null;
    }
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
    console.log("Will create new workspace",workspaceName);
    const ws = await Workspace.create(workspaceName);
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
