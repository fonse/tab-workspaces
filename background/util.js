const Util = {

  // Is the url compatible with the tabs.create API?
  isPermissibleURL(url) {
    const protocol = new URL(url).protocol;
    if (protocol === "about:" || protocol === "chrome:" || protocol === "moz-extension:") {
      return false;
    }

    return true;
  },

  // UUIDv4 from https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
  generateUUID() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    )
  }
}
