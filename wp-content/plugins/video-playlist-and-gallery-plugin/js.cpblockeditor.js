/* This section of the code registers a new block, sets an icon and a category, and indicates what type of fields it'll include. */
var cp_user_status = false;
var cp_doing_ajax_reqiest = false;
function checkLoginStatus(options){
      if(cp_user_status){
        if (typeof options.success === "function") {
          setTimeout(function(){
            options.success({success:true})
          },0)
          
        }
        return;
      }
      if(cp_doing_ajax_reqiest){
        if (typeof options.error === "function") {
          setTimeout(function(){
            options.success({success:false})
          },0);
        }
        return;
      }

      cp_doing_ajax_reqiest = true;
      jQuery.ajax({
      url: 'https://api.cincopa.com/v2/ping.json?api_token=session',
      type: options.type ? options.type : 'GET',
      xhrFields: {
        withCredentials: typeof options.disbledXhr != 'undefined' ? options.disbledXhr : true
      },
      dataType: options.dataType ? options.dataType : 'json',
      success: function (data) {
        if(data.success){
          cp_user_status = true;
        }else{
          cp_user_status = false;
        }
        if (typeof options.success === "function") {
          options.success(data)
        }
      },
      error: function (err) {
        cp_user_status = false;
        if (typeof options.error === "function") {
          options.error(err)
        }
      },
      complete:function(){
        cp_doing_ajax_reqiest = false;
      }
    })

  
}


Preview.prototype = Object.create(React.Component.prototype);
function Preview(props) {
  React.Component.constructor.call(this);
  var self = this;
 

  self.componentDidUpdate = function(prevProps){
      if(prevProps.embedId != self.props.embedId){
        appendEmbedCode();
    }
  }
  self.componentDidMount = function(){
    appendEmbedCode();
  }


  self.getRenderId = function(props){
    var idToRender;
    if(!props.embedId){
      idToRender = (props.savedCode.replace('[cincopa','').replace(']','')).trim();
    } else if (props.embedType == 'gallery') {
      idToRender = props.embedId;
    } else {
      idToRender = props.defaults[props.embedType] + '!' + props.embedId;
    }
    return idToRender;
  }

  function appendEmbedCode(){
    var idToRender = self.getRenderId(self.props);

    if(!idToRender){
        return;
    }

    if(document.getElementById('cincopa_'+idToRender.replace('!','_'))){
        document.getElementById('cincopa_'+idToRender.replace('!','_')).innerHTML = '';
    }

    var metajsonScript = document.createElement('script');
    metajsonScript.setAttribute(
    'src', 
    'https://rtcdn.cincopa.com/meta_json.aspx?ver=v2&fid='+ idToRender +'&id=cincopa_'+ idToRender.replace('!','_') );
    document.body.appendChild(metajsonScript);

    if(!document.getElementById('cplibasyncjs') ){
        var libasyncjs = document.createElement('script');
        libasyncjs.id = 'cplibasyncjs';
        libasyncjs.setAttribute(
        'src', 
        'https://rtcdn.cincopa.com/libasync.js');
        document.body.appendChild(libasyncjs);
    }

    
  }


  self.render = function () {
    var idToRender =  self.getRenderId(self.props);

    if (!idToRender) {
      return null;
    } else {
      return /*#__PURE__*/React.createElement("figure",null, /*#__PURE__*/React.createElement("div",{
        id: `cincopa_${idToRender.replace('!','_')}`,
        className:'gallerydemo cincopa-fadein'
      },
      '[cincopa '+ idToRender +']'
      ));
    }
  }
}
var defaultEmbed = {};

LibraryEditor.prototype = Object.create(React.Component.prototype);
function LibraryEditor(props) {
  var self = this;

  self.state = { 
    show: false
  };

  self.openLibraryEditor = function () {
    self.setState({
      show: true
    })
  }

  self.closeLibraryEditor = function () {
    self.setState({
      show: false
    })
  }

  self.componentDidUpdate = function(prevProps) {
    if(self.props.wpprops.isSelected && prevProps.wpprops.attributes.update !== self.props.wpprops.attributes.update){
      self.openLibraryEditor();
    }
    else if (prevProps.wpprops.isSelected !== self.props.wpprops.isSelected) {
      if(!self.props.wpprops.isSelected){
        self.closeLibraryEditor();
      }
    }
   

  }

  window.addEventListener("message", receiveMessage, false);

  function receiveMessage(event){
    
    
    if(event.data && event.data.sender == 'cincopa-assets-iframe' && self.props.wpprops.isSelected){
      if(event.data.action == 'insertedItem' || event.data.action == 'insertedGallery'){ 
        defaultEmbed = event.data.defaults;
        self.closeLibraryEditor();  
        self.props.updatePreview(event.data);
      }
    }
  }

  self.render = function () {
      
      return React.createElement("div",
            {
              className: "library-editor-block"
            },
            (typeof self.props.wpprops.attributes.content == 'undefined') && React.createElement("div",{
              className: '',
              
            },  
              React.createElement("div",{
              },'Select file from  your cincopa account.'),
              React.createElement("a",{
                className: 'cp_button',
                onClick: self.openLibraryEditor
              },"Insert from Cincopa")            
            ),
            React.createElement("iframe",{
              src:'https://www.cincopa.com/media-platform/api/library-editor.aspx?disable_editor=y&api_token=session',
              className: "library-editor-block__iframe",
              style: {
                'display': !self.state.show ? 'none' : 'flex'
              }
            })
      )
        
  }
}


CincopaEmbed.prototype = Object.create(React.Component.prototype);
function CincopaEmbed(props) {
  React.Component.constructor.call(this);
  var self = this;

  self.state = { 
    embedId: '',
    isLoggedin: false,
    isStatusChecked: false,
    savedCode: props.savedCode ? props.savedCode : '',
    isClick: false,
    defaults: {}
  };
  var userStatusTimer;
  self.checkUserStatusAjax = function () {  
    checkLoginStatus({
      success:function(){
        self.setState({isStatusChecked: true})
        if(cp_user_status){
          clearInterval(userStatusTimer)
          self.setState({ isLoggedin: true });
        }
      },
      error:function(){
        self.setState({isStatusChecked: true});
      }
    }
    )
  }
  self.checkUserStatusAjax();
  userStatusTimer = setInterval(function(){
    self.checkUserStatusAjax();
  },2000);

  self.updatePreview = function(data){
    self.setState({
      embedId: data.fid || data.item.rid,
      embedType: data.action == 'insertedGallery'? 'gallery' : data.item.type,
      isClick: true,
      defaults: data.defaults
    });


    /* call props to allow wp save */
    if(self.state.embedType  != 'gallery'){
      self.props.onCreateEmbed(data.defaults[data.item.type]+'!'+data.item.rid);

    }else{
      self.props.onCreateEmbed(data.fid);
    } 
  }

  self.componentDidUpdate = function(prevProps) {
    if (prevProps.wpprops.isSelected !== self.props.wpprops.isSelected) {
      if(!self.props.wpprops.isSelected){
        self.setState({
          isClick: false
        })
      }
    }
   

  }

  self.render = function () {
    if(self.state.isStatusChecked) {
      if (self.state.isLoggedin || self.state.savedCode ) {
        return React.createElement(
          "div",
          { 
            className: 'cp_embed-wrapper ' + ( self.state.embedId ||  self.state.savedCode ?  'cp_embed-wrapper--view' : '')
          },
          React.createElement('div',{
            className: 'cp_embed-layer ' + (self.state.isClick ? 'cp_hide' : ''),
             onClick: function(e)  {
               self.setState({isClick: true})
             }
          }),
          React.createElement(LibraryEditor, {
            updatePreview:self.updatePreview,
            wpprops:self.props.wpprops
          }),
          React.createElement(Preview,{ 
              embedId: self.state.embedId,
              embedType: self.state.embedType,
              defaults: self.state.defaults,
              savedCode:self.state.savedCode            
            }),
        );
      } else {
        return React.createElement("div",{
        },
        React.createElement("div", {
          className: 'cp_logedin-block'
        }, React.createElement("img", {
          itemprop: "logo",
          width: "165",
          height: "46",
          src: "//wwwcdn.cincopa.com/_cms/design13/images/logo.png?fts=2019-01-02T12:34:09.3655589Z",
          alt: "cincopa"
        }), React.createElement("p", null, "Cincopa is a video, images and podcast hosting platform. ",
        React.createElement('a', {
          href: 'https://www.cincopa.com/wordpress/welcome',
          target: '_blank'
        },'Learn more')
        ), 
        React.createElement("a", {
          href: "https://www.cincopa.com/login.aspx",
          className: "cp_button",
          target: "_blank"
        },'Login'))
        )
       
      }
    }else {
      return React.createElement(
        "div",
        { 
          className: 'cp_loader'
        },'loading...'
      );
    }


  }
}


function mcm_register_menu_card_section_block() {
  var BlockControls = wp.editor.BlockControls;
  var el = wp.element.createElement;

  var cincopaIcon = el('svg', 
	{ 
		width: '20px', 
		height: '20px',
    version:"1.1",
    viewBox: "0 0 256.000000 256.000000"
	},
  el('g',
    {
      transform: "translate(0.000000,256.000000) scale(0.100000,-0.100000)"
    },
    el( 'path',
    { 
      d:'M1059 2535 c-262 -49 -478 -164 -670 -354 -195 -195 -319 -427 -364 -685 -22 -127 -20 -350 4 -473 69 -354 261 -637 521 -768 126 -64 221 -87 371 -93 251 -9 392 39 535 182 131 132 181 256 172 428 -7 117 -44 197 -131 282 -78 76 -175 131 -361 206 -79 32 -170 75 -200 95 -85 56 -170 156 -222 260 -57 113 -72 195 -57 295 42 272 284 459 732 567 80 19 153 38 161 40 74 26 -366 42 -491 18z'}
    ),
    el('path',
    { 
      d:'M1390 2231 c-181 -40 -322 -110 -421 -211 -114 -115 -150 -231 -94 -298 38 -45 90 -66 337 -136 239 -68 341 -106 433 -161 217 -131 328 -336 312 -579 -8 -123 -28 -191 -92 -321 -75 -150 -168 -278 -302 -414 l-113 -114 73 5 c127 9 332 91 492 197 94 62 270 238 335 335 67 101 141 256 177 371 27 89 28 92 28 365 0 270 0 277 -28 375 -52 189 -150 352 -262 438 -70 53 -183 105 -294 134 -84 23 -121 26 -296 29 -168 3 -214 1 -285 -15z'},
    )
    )
  );

  wp.blocks.registerBlockType('cincopa/embed',{
    title: 'Cincopa',
    icon: cincopaIcon,
    category: 'media',
    attributes: {
      content: { type: 'string' },
      update: { type: 'bool' }
    },
    /* This configures how the content and color fields will work, and sets up the necessary elements */

    edit: function (props) {
      function updateContent(id) {
        props.setAttributes({
          content: id
        })
      }
      return [props.attributes.content && el(BlockControls, { key: 'controls' }, // Display controls when the block is clicked on.
              el('div', { className: 'cp-components-toolbar' },
                el('span', {
                  style:{
                   
                  },
                  onClick:function(){
                    props.setAttributes({
                      update: !props.attributes.update
                    })
                  }                
                },
                "Replace from Cincopa")
              )
            ),
            React.createElement(CincopaEmbed,{ 
              onCreateEmbed: updateContent,
              savedCode: props.attributes.content,
              wpprops:props
            })]
    },
    save: function (props) {
      if(props.attributes.content){
        return '[cincopa ' + props.attributes.content + ']';
      }else{
        return '';
      }
     
    }
  })


}
wp.domReady(mcm_register_menu_card_section_block);