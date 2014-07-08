
// Developed by Roman Zhak
// for testing xsl documents in Internet Explorer 8+ ( MSXML 3.0 )
// full API: http://msdn.microsoft.com/en-us/library/ms757828(v=vs.85).aspx

;(function(){

    var _ua = navigator.userAgent.toLowerCase();
     if(!/msie/i.test(_ua)) 
     	throw new Error("This plugin supported only by IE");
      
      Object.keys = Object.keys || function( obj ) {
        var array = [];
         for( var key in obj ) obj.hasOwnProperty
          .call(obj, key) && array.push( key );                 
        return array;
      };

      var _extend = function( target, source ) {
        if ( source === null ) return target;
          for( var key in source ) if( source.hasOwnProperty( key ) ) {
           target[key] = source[key]; }
    	  return target;
      }

      , activeXTypes = { 

      	 xslt   : "Msxml2.XSLTemplate." ,
      	 xsl    : "Msxml2.FreeThreadedDOMDocument." ,
      	 xml    : "Msxml2.DOMDocument.", // is used by default
      	 schema : "MSXML2.XMLSchemaCache."

      	}

      , proto   = Object.prototype
      , doc     = document
      , getById = function( id ) {   
          return ( typeof id == 'string' || typeof id == 'number' ) ? doc.getElementById( id ) 
          : id;
       }
      , instances = 0
      , versionSupported = "6.0"	
      , topError = (function () { 
      	 var div = doc.createElement("div"), insideNode, node;
      	 _extend( div.style, {
            "background"   : "#CF7272",
            "padding"      : "9px",
            "margin"       : "5px",
            "color"        : "#ffffff"
      	 });
         return function( msg ) {
          if( !insideNode ) { 
             insideNode    = div.cloneNode();
            _extend( insideNode.style, {"position": "fixed", "left": "0px", "top": "0px", "width": "300px", "background": "#fff"})
             doc.getElementsByTagName("body")[0].appendChild( insideNode );
          }
           node = div.cloneNode();
      	   node.innerHTML = msg;
          insideNode.appendChild( node )
          return node;
        }
      }())

      , xhr = function( options , type ) {
        // use try because of incompatibility of version 3.0 & 6.0
        var req;
          try { 
      	   req = new ActiveXObject( activeXTypes[type || "xml"] + versionSupported ); 
      	     options && _extend( req, options );
          } catch( e ) { return topError("Mirosoft XML Core Services (MSXML) 6.0 is not installed.") }
      	 return req;
       }

      , XSL = function( xmldoc, xsldoc, schema 
      	/* this param should be included if you are about to validate xml using XMLSchema */ ) {
      	 this.xmldoc = xhr({async: false});
      	 this.xsldoc = xhr({async: false}, "xsl");
          if( schema && typeof schema.path === "string" ) {
              xmldoc = schema.path + xmldoc;
              xsldoc = schema.path + xsldoc;
              schema.xsd && ( schema.xsd = schema.path + schema.xsd );
          } 
         try {
      	   this.xmldoc.load( xmldoc );
      	   this.xsldoc.load( xsldoc );
         } catch(e) { return topError( "Can't load file: " + e.description ) }
      	 if( schema && schema.xsd ) {
      	  // some methods use MSXML 6.0. like validate
      	  // http://msdn.microsoft.com/en-us/library/ms760232(v=vs.85).aspx
          this.xsd = xhr( null , "schema" );
          this.xsddoc = schema.xsd;
          this.extdoc = xmldoc;
      	 };
      	instances++;
      };

     _extend( XSL.prototype, {
        // Creates a rental-model IXSLProcessor object that will use this template.
        "compile" : function( params ){
          var xslProc
            , xslt = new xhr( null, "xslt" );
              // stylesheet can't contain element doc
              try { xslt.stylesheet = this.xsldoc;
              } catch(e) { return topError( "Can't set stylesheet: " + e.description ) }
              xslProc = xslt.createProcessor();
              xslProc.input = this.xmldoc;
                if( params && Object.keys( params ).length > 0 ) {
                  var key, interim;
                   for( key in params ) {
                    interim = params[key]; 
                     if(typeof interim === 'string' || typeof interim === 'number') 
                       xslProc.addParameter( key, interim );
                     else  topError( "Wrong type of parameter " + key )
                   };
                 };
              xslProc.transform();
             this[0] = xslProc.output;
            return this;
        },

        "validate" : function( namespace ) {
          var adapt = xhr({async: false, validateOnParse: false}), err;
          // This code uses features that were implemented only in MSXML 6.0.
          // that goes with SP1
          // http://www.microsoft.com/ru-ru/download/details.aspx?id=6276
          // param like urn: namespace
          try {
             this.xsd.add( namespace, this.xsddoc );
           } catch( e ) { return topError("Failed to add to schema: " + e.description )}
           adapt.schemas = this.xsd;
          try {
             adapt.load( this.extdoc );
           } catch( e ) { return topError("Can't load file: " + e.description )}
           err = adapt.validate();
           // Try to count errors
           if (err.errorCode !== 0 ) return topError( "Invalid dom: \n" + err.reason );
            else
             return this;
          }, 

        "to" : function( $to, /* if need smth else to show */ msg ) {
          // by default it tries to use getElementById
          var nodeTo;
          // [object HTMLCollection] is supperted by ie instead of [object NodeList]
          // get only first element 
          // if you create more than one instance of XSL Class
          // it will be append to the next node
           if( proto.toString.call($to) === "[object HTMLCollection]" ) nodeTo = $to[ instances - 1 ];
             else nodeTo = getById($to);
           nodeTo['innerHTML'] = msg || this[0];
           return this;
        },

        "after" : function( events, context ) {
          var key, interim, $this = this;
            for( key in events ) if( events.hasOwnProperty( key ) ) {
              interim = key.split(" ")
              elem = doc.querySelector( interim[1] );
              elem.attachEvent("on" + interim[0], ( function( $el, handler ){
                return function( event ) { handler.call( $el, $this, window.event ) }
              }( elem, events[key] )))
            }
            return this;
          },

         "val" : function( el ) {
          // ie8 fix value prop
           return el.value || el.options[el.selectedIndex].value;
         },

         "msg" : topError
      });


// expose the plugin
 
  this.XSLdocs = XSL;

}());
