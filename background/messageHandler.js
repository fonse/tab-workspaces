browser.runtime.onMessage.addListener(async m => {
  let response;

  switch (m.method) {
    case "getWorkspacesForCurrentWindow":
      response = BackgroundLogic.getWorkspacesForCurrentWindow();
      break;
    case "switchToWorkspace":
      await BackgroundLogic.switchToWorkspace(m.workspaceId);
      break;
    case "createNewWorkspace":
      await BackgroundLogic.createNewWorkspace(m.workspaceName);
      break;
    case "renameWorkspace":
      await BackgroundLogic.renameWorkspace(m.workspaceId, m.workspaceName);
      break;
    case "deleteWorkspace":
      await BackgroundLogic.deleteWorkspace(m.workspaceId);
      break;
  }

  return response;
});
