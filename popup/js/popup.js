document.addEventListener("click", (e) => {
  if (e.target.classList.contains("js-switch-workspace")) {
    var workspaceId = e.target.dataset.workspaceId;
    browser.runtime.sendMessage({
      method: "switchToWorkspace",
      workspaceId: workspaceId
    });
    window.close();

  } else if (e.target.classList.contains("js-new-workspace")) {
    browser.runtime.sendMessage({
      method: "createNewWorkspace",
      workspaceName: "New Workspace"
    });

    window.close();
  }
});
