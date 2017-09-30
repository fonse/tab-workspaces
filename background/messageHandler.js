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
  }

  return response;
});
