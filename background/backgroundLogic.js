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
    console.log("About to delete",workspaceId);
  },

  async getCurrentWindowId() {
    const currentWindow = await browser.windows.getCurrent();

    return currentWindow.id;
  }

};
