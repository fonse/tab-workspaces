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

  async deleteWorkspaceState(workspaceId) {
    const key = `workspaces@${workspaceId}`;
    await browser.storage.local.remove(key);
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
  },

  async unregisterWorkspaceToWindow(windowId, workspaceId) {
    const key = `windows@${windowId}`;
    const results = await browser.storage.local.get(key);
    const workspacesForWindow = results[key] || [];

    const index = workspacesForWindow.findIndex(aWorkspaceId => aWorkspaceId == workspaceId);
    workspacesForWindow.splice(index, 1);

    await browser.storage.local.set({
      [key]: workspacesForWindow
    });
  }

}
