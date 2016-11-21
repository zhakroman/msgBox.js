;(function(global, store){
   // main url to make a request (only https)
   var url = 'https://twiddlebot.ru/api/';

   // save store.js copy 
   var store = store();

   // global store data
   var globals = {};

   //  Executes a provided function once per array or object element
   //  @param {Object|Array} [object]
   //  @param {Function}     [callback]
   //  @param {Object}       [context]

   function forEach( object, callback, context ) {
     var keys   = Object.keys( object )
       , length = keys["length"]
       , index  = length - 1
       , temp;
    
      while( length-- ) callback
        .call( context || this, index - length, object[(temp = keys[length])], temp );
     };

   var JSONP = function(url,data,method,callback){
    //Set the defaults
    url = url || '';
    data = data || {};
    method = method || '';
    callback = callback || function(){};
    
    //Gets all the keys that belong
    //to an object
    
    var getKeys = function(obj){
      var keys = [];
      for(var key in obj){
        if (obj.hasOwnProperty(key)) {
          keys.push(key);
        }
      }
      return keys;
    }
    
    //Turn the data object into a query string.
    //Add check to see if the second parameter is indeed
    //a data object. If not, keep the default behaviour
    
    if(typeof data == 'object'){
      var queryString = '';
      var keys = getKeys(data);
      for(var i = 0; i < keys.length; i++){
        queryString += encodeURIComponent(keys[i]) + '=' + encodeURIComponent(data[keys[i]])
        if(i != keys.length - 1){ 
          queryString += '&';
        }
      }
      url += '?' + queryString;
    } else if(typeof data == 'function'){
      method = data;
      callback = method;
    }

    //If no method was set and they used the callback param in place of
    //the method param instead, we say method is callback and set a
    //default method of "callback"
    if(typeof method == 'function'){
      callback = method;
      method = 'callback';
    }
  
    //Check to see if we have Date.now available, if not shim it for older browsers
    if(!Date.now){
      Date.now = function() { return new Date().getTime(); };
    }

    //Use timestamp + a random factor to account for a lot of requests in a short time
    //e.g. jsonp1394571775161 
    var timestamp = Date.now();
    var generatedFunction = 'jsonp'+Math.round(timestamp+Math.random()*1000001)

    //Generate the temp JSONP function using the name above
    //First, call the function the user defined in the callback param [callback(json)]
    //Then delete the generated function from the window [delete window[generatedFunction]]
    window[generatedFunction] = function(json){
      callback(json);

      // IE8 throws an exception when you try to delete a property on window
      // http://stackoverflow.com/a/1824228/751089
      try {
        delete window[generatedFunction];
      } catch(e) {
        window[generatedFunction] = undefined;
      }

    };

    //Check if the user set their own params, and if not add a ? to start a list of params
    //If in fact they did we add a & to add onto the params
    //example1: url = http://url.com THEN http://url.com?callback=X
    //example2: url = http://url.com?example=param THEN http://url.com?example=param&callback=X
    if(url.indexOf('?') === -1){ url = url+'?'; }
    else{ url = url+'&'; }
  
    //This generates the <script> tag
    var jsonpScript = document.createElement('script');
    // if debug mode is true 
    if ( Q.debug ) try { console.log('Url request: ', url+method+'='+generatedFunction ) } catch(e) {};
     jsonpScript.setAttribute("src", url+method+'='+generatedFunction);
     document.getElementsByTagName("head")[0].appendChild(jsonpScript)
  }

  // Main Class to create deferred object

  function Deferred() {
    this._done = [];
    this._fail = [];
   }

   Deferred.prototype = {
     execute: function(list, args, context){
       var i = list.length;

      // convert arguments to an array
      // so they can be sent to the
      // callbacks via the apply method
      
      args = Array.prototype.slice.call(args);

      while(i--) list[i].apply(null, args);
      },
     resolve: function(){
       this.execute(this._done, arguments);
      },
     reject: function(){
       this.execute(this._fail, arguments);
      }, 
     done: function(callback){
      this._done.push(callback.bind({
        log : function(args) {
          console.log('Type:done ', args)
        }
      }));
      return this;
      },
     fail: function(callback){
      this._fail.push(callback.bind({
        log : function(args) {
          console.log('Type:error ', args)
        }
      }));
      return this;
     }  
   };

   // in a few cases we've chosen optimizing script length over efficiency of code.
// I think that is the right choice for this library.  If you're adding and
// triggering A LOT of events, you might want to use a different library.
var Events = {
    convert: function(obj, handlers) {
        // we store the list of handlers as a local variable inside the scope
        // so that we don't have to add random properties to the object we are
        // converting. (prefixing variables in the object with an underscore or
        // two is an ugly solution)
        //      we declare the variable in the function definition to use two less
        //      characters (as opposed to using 'var ').  I consider this an inelegant
        //      solution since smokesignals.convert.length now returns 2 when it is
        //      really 1, but doing this doesn't otherwise change the functionallity of
        //      this module, so we'll go with it for now
        handlers = {};

        // add a listener
        obj.on = function(eventName, handler) {
            // either use the existing array or create a new one for this event
            //      this isn't the most efficient way to do this, but is the shorter
            //      than other more efficient ways, so we'll go with it for now.
            (handlers[eventName] = handlers[eventName] || [])
                // add the handler to the array
                .push(handler);

            return obj;
        }

        // add a listener that will only be called once
        obj.once = function(eventName, handler) {
            // create a wrapper listener, that will remove itself after it is called
            function wrappedHandler() {
                // remove ourself, and then call the real handler with the args
                // passed to this wrapper
                handler.apply(obj.off(eventName, wrappedHandler), arguments);
            }
            // in order to allow that these wrapped handlers can be removed by
            // removing the original function, we save a reference to the original
            // function
            wrappedHandler.h = handler;

            // call the regular add listener function with our new wrapper
            return obj.on(eventName, wrappedHandler);
        }

        // remove a listener
        obj.off = function(eventName, handler) {
            // loop through all handlers for this eventName, assuming a handler
            // was passed in, to see if the handler passed in was any of them so
            // we can remove it
            //      it would be more efficient to stash the length and compare i
            //      to that, but that is longer so we'll go with this.
            for (var list = handlers[eventName], i = 0; handler && list && list[i]; i++) {
                // either this item is the handler passed in, or this item is a
                // wrapper for the handler passed in.  See the 'once' function
                list[i] != handler && list[i].h != handler ||
                    // remove it!
                    list.splice(i--,1);
            }
            // if i is 0 (i.e. falsy), then there are no items in the array for this
            // event name (or the array doesn't exist)
            if (!i) {
                // remove the array for this eventname (if it doesn't exist then
                // this isn't really hurting anything)
                delete handlers[eventName];
            }
            return obj;
        }

        obj.emit = function(eventName) {
            // loop through all handlers for this event name and call them all
            //      it would be more efficient to stash the length and compare i
            //      to that, but that is longer so we'll go with this.
            for(var list = handlers[eventName], i = 0; list && list[i];) {
                list[i++].apply(obj, list.slice.call(arguments, 1));
            }
            return obj;
        }

        return obj;
    }
}

   // Main class for requests to build valid request 
   // Just pass method and params as plain object

   var USERS = ['get', 'set', 'create', 'restore', 'logout', '@verify', 'rate']
     , STORE = ['set', 'get', 'remove', 'clear', 'getAll']
     , USERS_API = {};

   function Q() {};

   Q.prototype.api = function(method, params) {
    var d     = new Deferred()
    ,   $this = this;
    try {
     var reqURL = url + method.replace('.', '/');
     JSONP(reqURL, params, function(data){ 
       if(data && data.response) d.resolve(data.response, $this, method);
       else d.reject(data, $this, method)
      })
     } catch(e) { throw new Error(e); };
    return d;
   }

   Q.prototype.users = function(options) {
    var $this = this;
    options = options || {};
    forEach(USERS, function(index, value)  {
     USERS_API[value] = function(params) {
       params = params || {};
       if(!options.access_token) {
         if(globals.access_token) params.access_token = $this.get(globals.access_token).token;
      }
       return $this.api('users.' + value, params);
       }
     });
    return USERS_API;
   }

    forEach(STORE, function(index, value)  {
     Q.prototype[value] = function() {
        return store[value].apply(null, arguments);
       }
     });

   Q.prototype.auth = function(data) {
    var self = this;
     this.api('users.auth', data).done(function(res){
      self.set('user', res);
      Q.emit('ready');
     }).fail(Q.$this);
   }

   Q.prototype.globals = function(key, value) {
     globals[key] = value;
     return this;
   }

   Q.$this = function(error) {
     this.log(arguments);
     return this;
   };

   // debug mode for JS SDK
   Q.debug = false ;
   Q.filesURL = 'https://twiddlebot.ru/web/uploads';

   global.TWBot = Events.convert(Q);
   
}(window, function(){

  // Store.js
  // store.set('username', 'marcus')
  // store.get('username')
  // store.remove('username')
  // store.clear() - Clear all keys
  // store.set('user', { name: 'marcus', likes: 'javascript' })

  var store = {},
    win = (typeof window != 'undefined' ? window : global),
    doc = win.document,
    localStorageName = 'localStorage',
    scriptTag = 'script',
    storage

  store.disabled = false
  store.version = '1.3.20'
  store.set = function(key, value) {}
  store.get = function(key, defaultVal) {}
  store.has = function(key) { return store.get(key) !== undefined }
  store.remove = function(key) {}
  store.clear = function() {}
  store.transact = function(key, defaultVal, transactionFn) {
    if (transactionFn == null) {
      transactionFn = defaultVal
      defaultVal = null
    }
    if (defaultVal == null) {
      defaultVal = {}
    }
    var val = store.get(key, defaultVal)
    transactionFn(val)
    store.set(key, val)
  }
  store.getAll = function() {
    var ret = {}
    store.forEach(function(key, val) {
      ret[key] = val
    })
    return ret
  }
  store.forEach = function() {}
  store.serialize = function(value) {
    return JSON.stringify(value)
  }
  store.deserialize = function(value) {
    if (typeof value != 'string') { return undefined }
    try { return JSON.parse(value) }
    catch(e) { return value || undefined }
  }

  // Functions to encapsulate questionable FireFox 3.6.13 behavior
  // when about.config::dom.storage.enabled === false
  // See https://github.com/marcuswestin/store.js/issues#issue/13
  function isLocalStorageNameSupported() {
    try { return (localStorageName in win && win[localStorageName]) }
    catch(err) { return false }
  }

  if (isLocalStorageNameSupported()) {
    storage = win[localStorageName]
    store.set = function(key, val) {
      if (val === undefined) { return store.remove(key) }
      storage.setItem(key, store.serialize(val))
      return val
    }
    store.get = function(key, defaultVal) {
      var val = store.deserialize(storage.getItem(key))
      return (val === undefined ? defaultVal : val)
    }
    store.remove = function(key) { storage.removeItem(key) }
    store.clear = function() { storage.clear() }
    store.forEach = function(callback) {
      for (var i=0; i<storage.length; i++) {
        var key = storage.key(i)
        callback(key, store.get(key))
      }
    }
  } else if (doc && doc.documentElement.addBehavior) {
    var storageOwner,
      storageContainer
    // Since #userData storage applies only to specific paths, we need to
    // somehow link our data to a specific path.  We choose /favicon.ico
    // as a pretty safe option, since all browsers already make a request to
    // this URL anyway and being a 404 will not hurt us here.  We wrap an
    // iframe pointing to the favicon in an ActiveXObject(htmlfile) object
    // (see: http://msdn.microsoft.com/en-us/library/aa752574(v=VS.85).aspx)
    // since the iframe access rules appear to allow direct access and
    // manipulation of the document element, even for a 404 page.  This
    // document can be used instead of the current document (which would
    // have been limited to the current path) to perform #userData storage.
    try {
      storageContainer = new ActiveXObject('htmlfile')
      storageContainer.open()
      storageContainer.write('<'+scriptTag+'>document.w=window</'+scriptTag+'><iframe src="/favicon.ico"></iframe>')
      storageContainer.close()
      storageOwner = storageContainer.w.frames[0].document
      storage = storageOwner.createElement('div')
    } catch(e) {
      // somehow ActiveXObject instantiation failed (perhaps some special
      // security settings or otherwse), fall back to per-path storage
      storage = doc.createElement('div')
      storageOwner = doc.body
    }
    var withIEStorage = function(storeFunction) {
      return function() {
        var args = Array.prototype.slice.call(arguments, 0)
        args.unshift(storage)
        // See http://msdn.microsoft.com/en-us/library/ms531081(v=VS.85).aspx
        // and http://msdn.microsoft.com/en-us/library/ms531424(v=VS.85).aspx
        storageOwner.appendChild(storage)
        storage.addBehavior('#default#userData')
        storage.load(localStorageName)
        var result = storeFunction.apply(store, args)
        storageOwner.removeChild(storage)
        return result
      }
    }

    // In IE7, keys cannot start with a digit or contain certain chars.
    // See https://github.com/marcuswestin/store.js/issues/40
    // See https://github.com/marcuswestin/store.js/issues/83
    var forbiddenCharsRegex = new RegExp("[!\"#$%&'()*+,/\\\\:;<=>?@[\\]^`{|}~]", "g")
    var ieKeyFix = function(key) {
      return key.replace(/^d/, '___$&').replace(forbiddenCharsRegex, '___')
    }
    store.set = withIEStorage(function(storage, key, val) {
      key = ieKeyFix(key)
      if (val === undefined) { return store.remove(key) }
      storage.setAttribute(key, store.serialize(val))
      storage.save(localStorageName)
      return val
    })
    store.get = withIEStorage(function(storage, key, defaultVal) {
      key = ieKeyFix(key)
      var val = store.deserialize(storage.getAttribute(key))
      return (val === undefined ? defaultVal : val)
    })
    store.remove = withIEStorage(function(storage, key) {
      key = ieKeyFix(key)
      storage.removeAttribute(key)
      storage.save(localStorageName)
    })
    store.clear = withIEStorage(function(storage) {
      var attributes = storage.XMLDocument.documentElement.attributes
      storage.load(localStorageName)
      for (var i=attributes.length-1; i>=0; i--) {
        storage.removeAttribute(attributes[i].name)
      }
      storage.save(localStorageName)
    })
    store.forEach = withIEStorage(function(storage, callback) {
      var attributes = storage.XMLDocument.documentElement.attributes
      for (var i=0, attr; attr=attributes[i]; ++i) {
        callback(attr.name, store.deserialize(storage.getAttribute(attr.name)))
      }
    })
  }

  try {
    var testKey = '__storejs__'
    store.set(testKey, testKey)
    if (store.get(testKey) != testKey) { store.disabled = true }
    store.remove(testKey)
  } catch(e) {
    store.disabled = true
  }
  store.enabled = !store.disabled
  
  return store
}));
