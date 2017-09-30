const Logic = {

  init(){
    Logic.renderPopup();

    Logic.registerClickHandler();
  },

  registerClickHandler() {
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("js-switch-workspace")) {
        var workspaceId = e.target.dataset.workspaceId;
        Logic.callBackground("switchToWorkspace", {
          workspaceId: workspaceId
        });

        window.close();

      } else if (e.target.classList.contains("js-new-workspace")) {
        const list = document.querySelector("#workspace-list");
        const nextNumber = list.childNodes.length + 1;

        Logic.callBackground("createNewWorkspace", {
          workspaceName: `Workspace ${nextNumber}`
        });

        window.close();
      }
    });
  },

  async renderPopup() {
    const workspaces = await Logic.callBackground("getWorkspacesForCurrentWindow");

    const fragment = document.createDocumentFragment();
    workspaces.forEach(workspace => {
      const li = document.createElement("li");
      li.classList.add("js-switch-workspace");
      if (workspace.active){
        li.classList.add("active");
      }
      li.textContent = workspace.name;
      li.dataset.workspaceId = workspace.id;
      fragment.appendChild(li);
    });

    const list = document.querySelector("#workspace-list");
    list.innerHTML = '';
    list.appendChild(fragment);
  },

  async callBackground(method, args) {
    const message = Object.assign({}, {method}, args);

    return await browser.runtime.sendMessage(message);
  }

}

Logic.init();
