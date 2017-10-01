const Logic = {

  workspaces: [],

  async init(){
    // We need the workspaces for rendering, so wait for this one
    await Logic.fetchWorkspaces();

    Logic.renderWorkspacesList();
    Logic.renderWorkspacesEdit();
    Logic.registerEventListeners();
  },

  registerEventListeners() {
    document.addEventListener("click", e => {
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

      } else if (e.target.classList.contains("js-switch-panel")) {
        document.querySelectorAll(".container").forEach(el => el.classList.toggle("hide"));

      } else if (e.target.classList.contains("js-edit-workspace")) {
        const input = e.target.parentNode.childNodes[0];
        input.disabled = false;
        input.focus();

      } else if (e.target.classList.contains("js-delete-workspace")) {
        const workspaceId = e.target.parentNode.dataset.workspaceId;
        Logic.callBackground("deleteWorkspace", {
          workspaceId: workspaceId
        });
      }
    });

    document.addEventListener("change", async e => {
      if (e.target.classList.contains("js-edit-workspace-input")) {
        // Re-disable the input
        const name = e.target.value;
        e.target.disabled = true;

        // Save new name
        const workspaceId = e.target.parentNode.dataset.workspaceId;
        await Logic.callBackground("renameWorkspace", {
          workspaceId: workspaceId,
          workspaceName: name
        });

        // And re-render the list panel
        await Logic.fetchWorkspaces();
        Logic.renderWorkspacesList();
      }
    });
  },

  async fetchWorkspaces() {
    this.workspaces = await Logic.callBackground("getWorkspacesForCurrentWindow");
  },

  async renderWorkspacesList() {
    const fragment = document.createDocumentFragment();

    this.workspaces.forEach(workspace => {
      const li = document.createElement("li");
      li.classList.add("workspace-list-entry", "js-switch-workspace");
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

  async renderWorkspacesEdit() {
    const fragment = document.createDocumentFragment();

    this.workspaces.forEach(workspace => {
      const li = document.createElement("li");
      li.classList.add("workspace-edit-entry");
      li.dataset.workspaceId = workspace.id;

      const input = document.createElement("input");
      input.classList.add("js-edit-workspace-input");
      input.type = "text";
      input.value = workspace.name;
      input.disabled = true;
      li.appendChild(input);

      const renameBtn = document.createElement("a");
      renameBtn.classList.add("edit-button", "edit-button-rename", "js-edit-workspace");
      renameBtn.href = "#";
      li.appendChild(renameBtn);

      const deleteBtn = document.createElement("a");
      deleteBtn.classList.add("edit-button", "edit-button-delete", "js-delete-workspace");
      deleteBtn.href = "#";
      li.appendChild(deleteBtn);

      fragment.appendChild(li);
    });

    const list = document.querySelector("#workspace-edit");
    list.innerHTML = '';
    list.appendChild(fragment);
  },

  async callBackground(method, args) {
    const message = Object.assign({}, {method}, args);

    return await browser.runtime.sendMessage(message);
  }

}

Logic.init();
