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
    case "renameWorkspace":
      BackgroundLogic.renameWorkspace(m.workspaceId, m.workspaceName);
      break;
    case "deleteWorkspace":
      BackgroundLogic.deleteWorkspace(m.workspaceId);
      break;
  }

  return response;
});
