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

  async rename(newName){
    this.name = newName;
    await WorkspaceStorage.storeWorkspaceState(this);
  }

  // Store hidden tabs in storage
  async prepareToHide(windowId){
    const tabs = await browser.tabs.query({
      windowId: windowId,
      pinned: false
    });

    tabs.forEach(tab => {
      const tabObject = Object.assign({}, tab);
      this.hiddenTabs.push(tabObject);
    })
  }

  // Then remove the tabs from the window
  async hide(windowId){
    this.active = false;
    await WorkspaceStorage.storeWorkspaceState(this);

    const tabIds = this.hiddenTabs.map(tab => tab.id);
    browser.tabs.remove(tabIds);
  }

  async show(windowId){
    const tabs = this.hiddenTabs.filter(tabObject => this.isPermissibleURL(tabObject.url));

    if (tabs.length == 0){
      tabs.push({
        url: null,
        active: true
      });
    }

    const promises = tabs.map(tabObject => {
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

  // Is the url compatible with the tabs.create API?
  isPermissibleURL(url) {
    const protocol = new URL(url).protocol;
    if (protocol === "about:" || protocol === "chrome:" || protocol === "moz-extension:") {
      return false;
    }

    return true;
  }

  static generateId() {
    // UUIDv4 from https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    )
  }
}
