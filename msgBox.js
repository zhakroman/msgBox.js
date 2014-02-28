/*!
 * msgBox v 1.0 
 * by Roman Zhak ( https://github.com/zhak55/msgBox )
 * Licensed under MIT ()
 */

;(function( $ ) {

  'use strict'

  var default_option = {
        massage           : null      ,
        callBeforeAlert   : false     ,
        callAfterAlert    : false     ,
        animation         : true      ,
        type              : 'silver'  ,
        delay             : 1500      ,
        text              : false     ,
           global : {
              floats           : 'left'   ,
              bottom          :  35      ,
              offsets         :  20   
          }
 }
   , 
 Throw = function( msg ){
   try {
     if (window.console && console.log) console['log']( msg ); }catch(e){}
}
 ,
   errors = {
     'msg'  : 'Missing text',
     'type' : 'Missing type',
     'body' : 'Missing container'
    }

  ,  defined = false
  
  ,  guid    = {
      'error'   : 0,
      'warn'    : 0,
      'success' : 0
  }
;
 $.support.transition = (function() {

    var el = document.createElement('msgBox')

    var transEndEventNames = {
      'WebkitTransition' : 'webkitTransitionEnd',
      'MozTransition'    : 'transitionend',
      'OTransition'      : 'oTransitionEnd otransitionend',
      'transition'       : 'transitionend'
    }

    for (var name in transEndEventNames) {
      if (el.style[name] !== undefined) {
        return { end: transEndEventNames[name] }
      }
    }

    return false 

  })()

  // http://blog.alexmaccaw.com/css-transitions

 $.fn.emulateTransitionEnd = function (duration) {
    var called = false, $el = this
    $(this).one($.support.transition.end, function () { called = true })
    var callback = function () { if (!called) $($el).trigger($.support.transition.end) }
    setTimeout(callback, duration)
    return this
  }

function MsgBox( options ){
    this.options   =  $.extend( {}, default_option, options );
    this.root      = '.msgbox_container';
    this.box       = $( document ).find( this.root );
    this.cssFloats =  { left: 'slideInLeft', right: 'slideInRight' }
    this.count     = 0;  
};


MsgBox.prototype.create = function(){

  if ( this.box.length < 1 ) return Throw(errors['body']);
  this.count = $( this.root + ' > div' ).length;
  guid[this.options.type]++;

  var domElement = $('<div></div>')
    .addClass('msg_box_in MsgBox_' + this.options.type)
      .attr({'data': this.options.id = this.count})
    [ this.options.text ? 'text' : 'html' ](  this.options.massage  )

      //  custom Events
      
   .bind({
      'closed.msgBox.Event'  : $.proxy(this.options.callAfterAlert, this.options  , guid) , 
      'before.msgBox.Event'  : $.proxy(this.options.callBeforeAlert, this.options , guid) 
    })

  domElement.trigger('before.msgBox.Event')
  $( this.root ).append( domElement );
    $.support.transition && this.options.animation ? 
     domElement
      .addClass('animated ' + this.cssFloats[default_option.global.floats])
        .one( $.support.transition.end , 
      $.proxy(this.clear, this)).emulateTransitionEnd( 1000 )
    : this.clear();
 }

MsgBox.prototype.clear = function() {
  $( this.root + ' > div[data="' + this.count + '"]' )
    .removeClass('slideInLeft')
    .delay( this.options.delay )
    .fadeOut( 500 , function(){
   $( this ).trigger('closed.msgBox.Event').remove()

  }); 
}

MsgBox.prototype.container = function() { 
 !defined && 
   $('body').append( $('<div></div>' ).addClass('msgbox_container') );
   $('.msgbox_container').css({'bottom': default_option.global.bottom, 'left': '', 'right': ''}
      ).css( default_option.global.floats , default_option.global.offsets 
    )
  defined = true;
}

// global export 
 
  $.msgBox = function ( option ) {
      return  !default_option.massage || !option.massage ?  Throw(errors['msg']) : 
        (new MsgBox( option )).create();
 };
 

 $.msgBox.set = function( defaults ){
  // Merged recursively
   $.extend( true, default_option, defaults || {} ) ;
    if( defaults.global ) MsgBox.prototype.container();
 }

 $( MsgBox.prototype.container );

})( jQuery );
