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
  },

  matchesQuery(subject, query){
    return query.split(" ")
      .filter(token => token)
      .every(token => subject.toLowerCase().indexOf(token.toLowerCase()) != -1);
  },

  flattenArray(arr) {
    return arr.reduce(
      (acc, cur) => acc.concat(cur),
      []
    );
  },

  // From https://gist.github.com/nmsdvid/8807205
  debounce(func, wait, immediate) {
  	var timeout;

    return () => {
  		var context = this;
      var args = arguments;

      clearTimeout(timeout);
      timeout = setTimeout(() => {
  			timeout = null;
  			if (!immediate){
          func.apply(context, args);
        }
  		}, wait);

  		if (immediate && !timeout){
        func.apply(context, args);
      }
  	};
  }
}
