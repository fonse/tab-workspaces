class Workspace {
  constructor(id, name, active, hiddenTabs) {
    this.id = id;
    this.name = name;
    this.active = active;
    this.hiddenTabs = hiddenTabs;
  }

  static async create(windowId, name, active) {
    const workspace = new Workspace(Util.generateUUID(), name, active || false, []);
    await workspace.storeState();
    await WorkspaceStorage.registerWorkspaceToWindow(windowId, workspace.id);

    return workspace;
  }

  static async find(workspaceId) {
    const workspace = new Workspace(workspaceId);
    await workspace.refreshState();

    return workspace;
  }

  async rename(newName) {
    this.name = newName;
    await this.storeState();
  }

  async getTabCount() {
    if (this.active){
      // Not counting pinned tabs. Should we?
      const currentWindow = await browser.windows.getCurrent();
      const tabs = await browser.tabs.query({
        pinned: false,
        windowId: currentWindow.id
      });

      return tabs.length;
    } else {
      return this.hiddenTabs.length;
    }
  }

  async toObject() {
    const obj = Object.assign({}, this);
    obj.tabCount = await this.getTabCount();

    return obj;
  }

  // Store hidden tabs in storage
  async prepareToHide(windowId) {
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
  async hide(windowId) {
    this.active = false;
    await this.storeState();

    const tabIds = this.hiddenTabs.map(tab => tab.id);
    browser.tabs.remove(tabIds);
  }

  async show(windowId) {
    const tabs = this.hiddenTabs.filter(tabObject => Util.isPermissibleURL(tabObject.url));

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
    await this.storeState();
  }

  // Then remove the tabs from the window
  async delete(windowId) {
    await WorkspaceStorage.deleteWorkspaceState(this.id);
    await WorkspaceStorage.unregisterWorkspaceToWindow(windowId, this.id);
  }

  async attachTab(tab) {
    const tabObject = Object.assign({}, tab);
    this.hiddenTabs.push(tabObject);

    await this.storeState();
  }

  async detachTab(tab) {
    // We need to refresh the state because if the active workspace was switched we might have an old reference
    await this.refreshState();

    if (this.active){
      // If the workspace is currently active, simply remove the tab.
      await browser.tabs.remove(tab.id);
    } else {
      // Otherwise, forget it from hiddenTabs
      const index = this.hiddenTabs.findIndex(tabObject => tabObject.id == tab.id);
      if (index > -1){
        this.hiddenTabs.splice(index, 1);
        await this.storeState();
      }
    }
  }

  async refreshState() {
    const state = await WorkspaceStorage.fetchWorkspaceState(this.id);

    this.name = state.name;
    this.active = state.active;
    this.hiddenTabs = state.hiddenTabs;
  }

  async storeState() {
    await WorkspaceStorage.storeWorkspaceState(this.id, {
      name: this.name,
      active: this.active,
      hiddenTabs: this.hiddenTabs
    });
  }
}
