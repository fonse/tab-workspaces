const BackgroundLogic = {

  init(){
    BackgroundLogic.initializeListeners();
    BackgroundLogic.initializeContextMenu();
  },

  initializeListeners(){
    browser.windows.onRemoved.addListener(BackgroundLogic.tearDownWindow);
    browser.windows.onFocusChanged.addListener(BackgroundLogic.updateContextMenu);
  },

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

    return workspaces.find(workspace => workspace.active);
  },

  async createNewWorkspace(workspaceName, active){
    const windowId = await BackgroundLogic.getCurrentWindowId();

    const workspace = await Workspace.create(windowId, workspaceName, active || false);
    BackgroundLogic.switchToWorkspace(workspace.id);

    return workspace;
  },

  async switchToWorkspace(workspaceId) {
    const windowId = await BackgroundLogic.getCurrentWindowId();

    const oldWorkspace = await BackgroundLogic.getCurrentWorkspaceForWindow(windowId);
    const newWorkspace = await WorkspaceStorage.fetchWorkspace(workspaceId);

    if (oldWorkspace.id == newWorkspace.id){
      // Nothing to do here
      return;
    }

    // Since we're gonna be closing all open tabs, we need to show the new ones first.
    // However, we first need to prepare the old one, so it can tell which tabs were the original ones and which were opened by the new workspace.
    await oldWorkspace.prepareToHide(windowId);
    await newWorkspace.show(windowId);
    await oldWorkspace.hide(windowId);
  },

  async renameWorkspace(workspaceId, workspaceName) {
    const workspace = await WorkspaceStorage.fetchWorkspace(workspaceId);

    await workspace.rename(workspaceName);
  },

  async deleteWorkspace(workspaceId) {
    const windowId = await BackgroundLogic.getCurrentWindowId();
    const currentWorkspace = await BackgroundLogic.getCurrentWorkspaceForWindow(windowId);
    const workspaceToDelete = await WorkspaceStorage.fetchWorkspace(workspaceId);

    if (currentWorkspace.id == workspaceId){
      const nextWorkspaceId = await WorkspaceStorage.fetchNextWorkspaceId(windowId, workspaceId);
      await BackgroundLogic.switchToWorkspace(nextWorkspaceId);
    }

    await workspaceToDelete.delete(windowId);
  },

  tearDownWindow(windowId) {
    // Don't tear down if the user is closing the browser
    setTimeout(() => {
      WorkspaceStorage.tearDownWindow(windowId);
    }, 5000);
  },

  async getCurrentWindowId() {
    const currentWindow = await browser.windows.getCurrent();

    return currentWindow.id;
  },

  async initializeContextMenu() {
    const id = Util.generateUUID();

    browser.menus.create({
      id: id,
      title: "Send Tab to Workspace",
      contexts: ["tab"]
    });

    const workspaces = await BackgroundLogic.getWorkspacesForCurrentWindow();
    workspaces.forEach(workspace => {
      browser.menus.create({
        title: workspace.name,
        parentId: id,
        id: workspace.id,
        enabled: !workspace.active,
        onclick: BackgroundLogic.handleContextMenuClick
      });
    });
  },

  async updateContextMenu(windowId) {
    if (windowId != browser.windows.WINDOW_ID_NONE){
      await browser.menus.removeAll();
      await BackgroundLogic.initializeContextMenu();
    }
  },

  async handleContextMenuClick(menu, tab) {
    const windowId = await BackgroundLogic.getCurrentWindowId();

    const destinationWorkspace = await WorkspaceStorage.fetchWorkspace(menu.menuItemId);
    const currentWorkspace = await BackgroundLogic.getCurrentWorkspaceForWindow(windowId);

    // Attach tab to destination workspace
    await destinationWorkspace.attachTab(tab);

    // If this is the last tab of the window, we need to switch workspaces
    const tabsInCurrentWindow = await browser.tabs.query({
      windowId: windowId,
      pinned: false
    });

    if (tabsInCurrentWindow.length == 1){
      await BackgroundLogic.switchToWorkspace(destinationWorkspace.id);
    }

    // Finally, detach tab from source workspace
    await currentWorkspace.detachTab(tab);
  }

};

BackgroundLogic.init();
