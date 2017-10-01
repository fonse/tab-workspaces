// This mock allows popup.html to be opened as a regular page for development
const BackgroundMock = {

  sendMessage(m){
    if (m.method == "getWorkspacesForCurrentWindow"){
      return BackgroundMock.getMockWorkspaces();

    } else {
      console.log(`Sending message ${m.method} to backend...`);
    }
  },

  getMockWorkspaces(){
    return [
      {
        id: "xxxxx",
        name: "Workspace 1",
        active: true,
        hiddenTabs: []
      },
      {
        id: "yyyyy",
        name: "Workspace 2",
        active: true,
        hiddenTabs: []
      },
      {
        id: "zzzzz",
        name: "Workspace 3",
        active: true,
        hiddenTabs: []
      }
    ];
  }

}
