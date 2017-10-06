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
    document.addEventListener("click", async e => {
      if (e.target.classList.contains("js-switch-workspace")) {
        const workspaceId = e.target.dataset.workspaceId;
        Logic.callBackground("switchToWorkspace", {
          workspaceId: workspaceId
        });

        window.close();

      } else if (e.target.classList.contains("js-new-workspace")) {
        Logic.callBackground("createNewWorkspaceAndSwitch");

        window.close();

      } else if (e.target.classList.contains("js-switch-panel")) {
        document.querySelectorAll(".container").forEach(el => el.classList.toggle("hide"));

      } else if (e.target.classList.contains("js-edit-workspace")) {
        const input = e.target.parentNode.childNodes[0];
        input.disabled = false;
        input.focus();

      } else if (e.target.classList.contains("js-delete-workspace")) {
        // Delete element
        const li = e.target.parentNode;
        if (li.parentNode.childNodes.length == 1){
          // Can't delete the last workspace
          return;
        }

        const workspaceId = li.dataset.workspaceId;
        li.parentNode.removeChild(li);

        // Delete the workspace
        await Logic.callBackground("deleteWorkspace", {
          workspaceId: workspaceId
        });

        // And re-render the list panel
        await Logic.fetchWorkspaces();
        Logic.renderWorkspacesList();
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

    // This focus is needed to capture key presses without user interaction
    document.querySelector("#keyupTrap").focus();
    document.addEventListener("keyup", async e => {
      const key = e.key;
      var index = parseInt(key);

      if (key.length == 1 && !isNaN(index)){
        if (index == 0){
          index = 10;
        }

        const el = document.querySelector(`#workspace-list li:nth-child(${index})`);
        if (el){
          Logic.callBackground("switchToWorkspace", {
            workspaceId: el.dataset.workspaceId
          });

          window.close();
        }
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
      li.innerHTML = `${workspace.name} <span class="tabs-qty">(${workspace.tabCount})</span>`;
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

    if (typeof browser != "undefined"){
      return await browser.runtime.sendMessage(message);
    } else {
      return BackgroundMock.sendMessage(message);
    }
  }

}

Logic.init();
