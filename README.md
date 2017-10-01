# Tab Workspaces

Organize your tabs into workspaces. Switch between workspaces to change which tabs are displayed at the moment.

This extension aims to be an alternative to [Tab Groups](https://addons.mozilla.org/en-US/firefox/addon/tab-groups-panorama/), which is no longer supported as of Firefox 57.

## Features
 - Each tab belongs to a workspace. New tabs are automatically added to the current workspace.
 - Switch between workspaces from the toolbar icon to keep your tabs organized.
 - Tabs in other workspaces are safely hidden away.
 - If you have multiple windows open, each one has its own set of workspaces.
 - Option to send a specific tab to another workspace from the right-click menu.

## Notice
There is no way to "hide" a tab with the WebExtensions API, so when switching between workspaces the tabs are actually closed and reopened.

This has the side effect of not maintaining the tabs' history, as well as stopping whatever process is going on when the tab is closed.

If you know any better way to hide the tabs, please let me know.

## Acknowledgements
This extension was inspired by [Multi-Account Containers](https://addons.mozilla.org/en-US/firefox/addon/multi-account-containers/), which also served as a reference for some of the functionality.

Special thanks to [@NicolasJEngler](http://nicolasjengler.com.ar/) for designing a beautiful UI for this extension!
