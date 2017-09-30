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
