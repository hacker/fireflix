function splitascii(s) {
 var rv='';
 for(var i=0;i<s.length;++i) {
  var w = s.charCodeAt(i);
  rv += String.fromCharCode(
   w&0xff, (w>>8)&0xff );
 }
 return rv;
}


var fireflix = {
 flickr: new Flickr(),
 init: function() {
  pull_elements(this,document,[
   'cmd_auth_auth','cmd_auth_done','cmd_auth_unauth',
   'menu_auth_done','b_auth','b_auth_done','auth_info',
   'loc_strings','cmd_set_props'
  ]);
  this.build_menus();
  this.foundphotos.init(this);
  this.photosets.init(this);
  this.photoset.init(this);
  this.uploads.init(this);
  this.uploadObserver.init(this);
  this.flickr.api_key = '9c43cd66947a57e6f29db1a9da3f72e3';
  this.flickr.api_shs = '9c33c9e2f0f0cfd5';
  this.flickr.prefs_root = 'net.klever.kin.fireflix';
  this.flickr.load_token();
  this.no_auth_info_label = this.auth_info.value;
  this.set_auth_state(this.flickr.token,false);
  if(this.flickr.token) {
   this.refresh_stuff();
  }else{
   this.on_cmd_auth();
  }
 },
 set_auth_state: function(au,inp) { /* authorized, in progress */
  this.cmd_auth_unauth.disabled = !au;
  this.b_auth.hidden = au || inp;
  this.b_auth_done.hidden = !inp;
  this.menu_auth_done.hidden = !inp;
  this.cmd_auth_done.setAttribute('disabled',!inp);
  this.auth_info.disabled = !au;
  if(au) {
   this.auth_info.value = this.flickr.user.fullname+' ['+this.flickr.user.username+']'; /* TODO: move to locale */
  }else{
   this.auth_info.value = this.no_auth_info_label;
  }
 },
 on_cmd_auth: function() {
  var _this = this;
  this.flickr.authorize_0(
   'delete',
   function(x,f,u) {
    _this.openTab(u);
    _this.set_auth_state(_this.flickr.token,true);
   }, function(x,s,c,m) {
    _this.flickr_failure(x,s,c,m);
   }
  );
 },
 on_cmd_auth_done: function() {
  this.set_auth_state(this.flickr.token,false);
  var _this = this;
  this.flickr.authorize_1(
   function() {
    _this.flickr.save_token();
    _this.refresh_stuff();
    _this.set_auth_state(_this.flickr.token,false);
    _this.auth_info.value = 
     _this.flickr.user.fullname+' ['+_this.flickr.user.username+']';
   }, function(x,s,c,m) {
    _this.set_auth_state(_this.flickr.token,false); /* XXX: no reset token? */
    _this.flickr_failure(x,s,c,m);
   }
  );
 },
 on_cmd_auth_unauth: function() {
  this.flickr.reset_token();
  this.set_auth_state(false,false);
 },

 refresh_sets: function() { this.photosets.refresh_sets(); },
 refresh_stuff: function() {
  this.refresh_sets();
  this.refresh_user_tags();
 },

 /* photoset treeview */
 photoset: {
  photos: new Array(),
  fireflix: null,
  init: function(f) {
   this.fireflix = f;
   pull_elements(this,document,[ 'set_photo', 'set_photo_props' ]);
   document.getElementById('setphotos').view = this;
  },
  rowCount: 0,
  getCellText: function(r,c) {
   var p = this.photos[r];
   if(c.id=='sp_title') return p.title;
   if(c.id=='sp_taken') return p.datetaken;
   if(c.id=='sp_upload') {
    var du = new Date(p.dateupload*1000);
    var rv = du.getFullYear()+'-'+(du.getMonth()+1)+'-'+du.getDate()
     +' '+
     du.getHours()+':'+du.getMinutes()+':'+du.getSeconds();
    return rv.replace(/(\D)(\d)(\D)/,'$10$2$3');
   }
   return c.id;
  },
  setTree: function(t) { this.tree = t },
  isContainer: function(r) { return false; },
  isSeparator: function(r) { return false; },
  isSorted: function(r) { return false; },
  getLevel: function(r) { return 0; },
  getImageSrc: function(r,c) { return null },
  getRowProperties: function(r,p) {},
  getCellProperties: function(cid,cel,p) {},
  getColumnProperties: function(cid,cel,p) { },
  cycleHeader: function(cid,e) { },
  getParentIndex: function(r) { return -1; },
  drop: function(r,o) { },
  canDropBeforeAfter: function(r,b) { return false },

  import_json: function(jp) {
   this.tree.beginUpdateBatch();
   this.photos = new Array();
   for(var i in jp) this.photos.push(new Photo(jp[i]));
   this.rowCount =this.photos.length;
   this.tree.endUpdateBatch();
   this.selection.clearSelection();
  },
  load_photos: function(psid) {
   var that = this;
   this.fireflix.flickr.api_call_json(
    {
     method: 'flickr.photosets.getPhotos',
     auth_token: 'default',
     photoset_id: psid,
     extras: 'license,date_upload,date_taken,owner_name,icon_server,original_format,last_update'
    }, function(x,j) {
     that.import_json(j.photoset.photo);
    }, function(x,s,c,m) {
     that.fireflix.flickr_failure(x,s,c,m);
    }
   );
  },
  on_select: function() {
   if(this.selection.count==1) {
    var p = this.photos[this.selection.currentIndex];
    this.set_photo.src =
     this.fireflix.flickr.get_photo_url(p.server,p.id,p.secret,'t');
    this.set_photo_props.hidden = false;
   }else{
    this.set_photo_props.hidden = true;
   }
  },
  on_cmd_open: function(ev) {
   if(this.selection.currentIndex<0) return;
   var p = this.photos[this.selection.currentIndex];
   if(!p.id) return;
   this.fireflix.openTab(this.fireflix.flickr.make_photo_url(p,'p'));
  }
 },

 /* photosets treeview */
 photosets: {
  sets: new Array(),
  fireflix: null,
  init: function(f) {
   this.fireflix = f;
   document.getElementById('setslist').view = this;
  },
  rowCount: 0,
  getCellText: function(r,c) {
   var s = this.sets[r];
   if(c.id=='sl_name') return s.title;
   if(c.id=='sl_photos') return s.photos;
   return c.id;
  },
  setTree: function(t) { this.tree = t },
  isContainer: function(r) { return false; },
  isSeparator: function(r) { return false; },
  isSorted: function() { return false; },
  getLevel: function(r) { return 0; },
  getImageSrc: function(r,c) { return null },
  getRowProperties: function(r,p) {},
  getCellProperties: function(cid,cel,p) { },
  getColumnProperties: function(cid,cel,p) { },
  cycleHeader: function(cid,e) { },
  getParentIndex: function(r) { return -1; },
  drop: function(r,o) { },
  canDropBeforeAfter: function(r,b) { return false },

  import_json: function(j) {
   this.tree.beginUpdateBatch();
   this.sets = new Array();
   for(var i in j) this.sets.push(new Photoset(j[i]));
   this.rowCount = this.sets.length;
   this.tree.endUpdateBatch();
  },
  refresh_sets: function() {
   var that = this;
   this.fireflix.flickr.api_call_json(
    {
     method: 'flickr.photosets.getList',
     auth_token: 'default'
    }, function(x,j) {
     that.import_json(j.photosets.photoset);
    }, function(x,s,c,m) {
     that.fireflix.flickr_failure(x,s,c,m);
    }
   );
  },
  on_select: function() {
   if(this.selection.count==1) {
    this.fireflix.cmd_set_props.setAttribute('disabled','false');
    var s = this.sets[this.selection.currentIndex];
    this.fireflix.photoset.load_photos(s.id);
   }else{
    this.fireflix.cmd_set_props.setAttribute('disabled','true');
   }
  },
  on_cmd_open_in_flickr: function(ev) {
   if(this.selection.currentIndex<0) return;
   var p = this.sets[this.selection.currentIndex];
   if(!p.id) return;
   this.fireflix.openTab(this.fireflix.flickr.make_photoset_url(p));
  }
 },

 refresh_user_tags: function() {
  var lb = document.getElementById('tagslist');
  var that = this;
  this.flickr.api_call_json(
   {
    method: 'flickr.tags.getListUser',
    auth_token: 'default',
   }, function(x,j) {
    var tt = j.who.tags.tag;
    for(var i in tt) lb.appendItem(tt[i]._content);
   }, function(x,s,c,m) {
    that.flickr_failure(x,s,c,m);
   }
  );
 },

 uploadObserver: {
  fireflix: null,
  init: function(f) {
   this.fireflix = f;
  },
  getSupportedFlavours: function() {
   var rv = new FlavourSet();
   rv.appendFlavour('application/x-moz-file','nsIFile');
   rv.appendFlavour('application/x-moz-url');
   rv.appendFlavour('text/uri-list');
   rv.appendFlavour('text/unicode');
   return rv;
  },
  canHandleMultipleItems: true,
  onDragOver: function(ev,fl,sess) {
   return true;
  },
  onDrop: function(ev,dd,s) {
   var ldf = null;
   for(var i in dd.dataList) {
    var di = dd.dataList[i];
    var dif = di.first;
    if(
     ldf==null
     || ldf.flavour.contentType!=dif.flavour.contentType
     || ldf.contentLength!=dif.contentLength
     || ldf.data!=dif.data )
     this.drop_item(ev,di,s);
    ldf = dif;
   }
  },
  drop_item: function(ev,di,s) {
   var d = di.first;
   switch(d.flavour.contentType) {
    case 'text/unicode':
     this.drop_urilist(ev,d.data,s);
     break;
    case 'application/x-moz-file':
     this.fireflix.uploads.add(d.data.path);
     document.getElementById('fireflix_tabs').selectedTab
      = document.getElementById('tab_upload');
     break;
    case 'text/uri-list':
     // is it ascii or could it be utf8?
     this.drop_urilist(ev,splitascii(d.data),s);
     break;
    default: alert(d.flavour.contentType+':'+d.data); break;
   };
  },
  drop_urilist: function(ev,ul,s) {
   // TODO: check for being a file?
   var us = decodeURIComponent(ul).split(/[\r\n]/);
   for(var ui in us)
    if(/\S/.test(us[ui]))
     this.fireflix.uploads.add(us[ui]);
   document.getElementById('fireflix_tabs').selectedTab
    = document.getElementById('tab_upload');
  }
 },

 uploads: {
  fireflix: null,
  init: function(f) {
   this.fireflix=f;
   pull_elements(this,document,[
    'upload_filename','upload_title','upload_file_preview',
    'upload_file_props','upload_progress','upload_tags',
    'cmd_uploads_upload', 'upload_failure', 'upload_is_public',
    'upload_is_friends', 'upload_is_family'
   ]);
   document.getElementById('uploadlist').view = this;
   this.upload_is_public.addEventListener(
    'CheckboxStateChange', { that: this,
     handleEvent: function(ev) { this.that.propsToSel('is_public'); }
    }, false );
   this.upload_is_friends.addEventListener(
    'CheckboxStateChange', { that: this,
     handleEvent: function(ev) { this.that.propsToSel('is_friends'); }
    }, false );
   this.upload_is_family.addEventListener(
    'CheckboxStateChange', { that: this,
     handleEvent: function(ev) { this.that.propsToSel('is_family'); }
    }, false );
  },
  files: new Array(),
  rowCount: 0,
  getCellText: function(r,c) {
   var f = this.files[r];
   if(c.id=='up_file') return f.file;
   if(c.id=='up_title') return f.title;
   if(c.id=='up_status') return f.state;
   return c.id;
  },
  setTree: function(t) { this.tree = t },
  isContainer: function(r) { return false; },
  isSeparator: function(r) { return false; },
  isSorted: function(r) { return false; },
  getLevel: function(r) { return 0; },
  getImageSrc: function(r,c) { return null },
  getRowProperties: function(r,p) {
   try {
    if(!Components) return;
   }catch(e) { return }
   var f = this.files[r];
   var as = Components.classes['@mozilla.org/atom-service;1'].
    getService(Components.interfaces.nsIAtomService);
   p.AppendElement(as.getAtom(f.state));
  },
  getCellProperties: function(r,c,p) { this.getRowProperties(r,p); },
  getColumnProperties: function(c,p) { },
  cycleHeader: function(cid,e) { },
  getParentIndex: function(r) { return -1; },
  drop: function(r,o) { },
  canDropBeforeAfter: function(r,b) { return false },

  add: function(f) {
   if(f.indexOf('file:/')==0) {
    f = f.substr(5);
    while(f.substr(0,2)=='//') { // XXX: not very performant, is it? ;-)
     f = f.substr(1);
    }
   }
   var t = f;
   var ls = t.lastIndexOf('/');
   if(ls>0) t = t.substr(ls+1);
   ls = t.lastIndexOf('\\');
   if(ls>0) t = t.substr(ls+1);
   var ld = t.lastIndexOf('.');
   if(ld>0) t = t.substr(0,ld);
   this.files.push( {
    file: f,
    title: t,
    tags: '',
    is_public: true, is_friend: false, is_family: false,
    state: 'pending'
   } );
   this.rowCount = this.files.length;
   this.tree.rowCountChanged(this.rowCount-1,1);
  },

  upload_worker: function() {
   for(var f in this.files) {
    if(this.files[f].state=='pending') {
     var ff = this.files[f];
     this.on_file_upload(ff);
     ff.state='uploading';
     this.tree.invalidate();
     var _this = this;
     this.fireflix.flickr.upload_file(
      ff.file, { 
       title: ff.title, tags: ff.tags,
       is_public: ff.is_public?'1':'0',
       is_friend: ff.is_friend?'1':'0',
       is_family: ff.is_family?'1':'0'
      }, function(x,p) {
       ff.photoid = p;
       _this.batch_ids.push(p);
       ff.state='completed';
       _this.tree.invalidate();
       window.setTimeout(_this.upload_to,0,_this);
      }, function(x,s,c,m) {
       ff.state='failed';
       ff.flickr_errcode = c;
       ff.flickr_errmsg = m;
       _this.tree.invalidate();
       window.setTimeout(_this.upload_to,0,_this);
      }
     );
     return;
    }
   }
   this.on_finish_upload();
  },
  upload_to: function(_this) { _this.upload_worker(); },
  on_file_upload: function(f) {
   this.cmd_uploads_upload.setAttribute('disabled','true');
   for(var fi in this.files) {
    if(this.files[fi].file==f.file) {
     this.tree.ensureRowIsVisible(fi);
     this.selection.rangedSelect(fi,fi,false);
     this.selection.currentIndex = fi;
     this.selToProps();
     break;
    }
   }
  },
  on_finish_upload: function() {
   if(this.batch_ids.length) {
    var psn = prompt(this.fireflix.loc_strings.getString('postUploadPhotoset'));
    if(psn!=null) {
     var pids = this.batch_ids.join(',');
     var ppid = this.batch_ids[0];
     var that = this;
     this.fireflix.flickr.api_call_json(
      {
       method: 'flickr.photosets.create',
       auth_token: 'default',
       title: psn,
       primary_photo_id: ppid
      }, function(x,j) {
       var npid = j.photoset.id;
       that.fireflix.flickr.api_call_json(
        {
	 method: 'flickr.photosets.editPhotos',
	 auth_token: 'default',
	 photoset_id: npid,
	 primary_photo_id: ppid,
	 photo_ids: pids
	}, function(x,j) {
	 that.fireflix.refresh_sets();
	}, function(x,s,c,m) {
	 that.fireflix.flickr_failure(x,s,c,m);
	}
       );
      }, function(x,s,c,m) {
       that.fireflix.flickr_failure(x,s,c,m);
      }
     );
    }
   }
   this.selection.clearSelection();
   this.cmd_uploads_upload.setAttribute('disabled','false');
   this.upload_progress.setAttribute('hidden','true');
  },

  clear_list: function() {
   this.tree.beginUpdateBatch();
   this.rowCount = 0;
   this.files = new Array();
   this.tree.endUpdateBatch();
   this.selToProps();
  },
  selectionChanged: function() {
   this.selToProps();
  },
  disableProps: function() {
   this.upload_filename.value='';
   this.upload_filename.disabled = true;
   this.upload_title.value='';
   this.upload_title.disabled = true;
   this.upload_file_preview.src = null;
   this.upload_tags.value='';
   this.upload_tags.disabled = true;
   this.upload_is_public.disabled = true;
   this.upload_is_friends.disabled = true;
   this.upload_is_family.disabled = true;
   /* this.upload_file_props.hidden = true; */
  },
  selToProps: function() {
   if(!this.selection.count) {
    this.disableProps();
    this.upload_file_props.hidden = true;
   }else if(this.selection.count==1) {
    var f=this.files[this.selection.currentIndex];
    if(f==null) {
     this.disableProps();
     this.upload_file_props.hidden = true;
    }else{
     var inactives = f.state!='pending';
     this.upload_filename.value = f.file; this.upload_filename.disabled = inactives;
     this.upload_title.value = f.title; this.upload_title.disabled = inactives;
     this.upload_file_preview.src = 'file:///'+f.file;
     this.upload_tags.value = f.tags; this.upload_tags.disabled = inactives;
     this.upload_is_public.checked = f.is_public; this.upload_is_public.disabled = inactives;
     this.upload_is_friends.checked = f.is_friend; this.upload_is_friends.disabled = inactives;
     this.upload_is_family.checked = f.is_family; this.upload_is_family.disabled = inactives;
     if(f.state=='failed') {
      this.upload_failure.textContent=((f.flickr_errcode<0)?'':f.flickr_errcode+': ')+f.flickr_errmsg;
      this.upload_failure.hidden = false;
     }else{
      this.upload_failure.hidden = true;
     }
     this.upload_file_props.hidden = false;
    }
   }else{
    var ftitle = null; var onetitle = true;
    var ftags = null; var onetag = true;
    var fs = 0;
    for(var ff in this.files) {
     if(this.selection.isSelected(ff) && this.files[ff].state=='pending' ) {
      ++fs;
      if(ftitle==null) {
       ftitle = this.files[ff].title;
      }else if(ftitle!=this.files[ff].title) {
       onetitle = false;
      }
      if(ftags==null) {
       ftags = this.files[ff].tags;
      }else if(ftags!=this.files[ff].tags) {
       onetag = false;
      }
     }
    }
    if(fs) {
     this.upload_filename.value='';
     this.upload_filename.disabled = true;
     if(onetitle)
      this.upload_title.value = ftitle;
     this.upload_title.disabled = false;
     if(onetag)
      this.upload_tags.value = ftags;
     this.upload_tags.disabled = false;
     this.upload_file_preview.src = null;
     this.upload_failure.hidden = true;
     this.upload_file_props.hidden = false;
    }else
     this.disableProps();
     this.upload_file_props.hidden = true;
   }
  },
  propsToSel: function(prop) {
   if(this.selection.count<=0) return;
   for(var ff in this.files) {
    if(this.selection.isSelected(ff) && this.files[ff].state=='pending') {
     if(prop=='filename') this.files[ff].file = this.upload_filename.value;
     if(prop=='title') this.files[ff].title = this.upload_title.value;
     if(prop=='tags') this.files[ff].tags = this.upload_tags.value;
     if(prop=='is_public') this.files[ff].is_public = this.upload_is_public.checked;
     if(prop=='is_friends') this.files[ff].is_friend = this.upload_is_friends.checked;
     if(prop=='is_family') this.files[ff].is_family = this.upload_is_family.checked;
     this.tree.invalidateRow(ff);
    }
   }
  },

  on_upload: function() {
   this.selToProps();
   this.batch_ids = new Array();
   this.upload_progress.value=0;
   this.upload_progress.setAttribute('hidden','false');
   this.upload_worker();
  },
  on_clear: function() {
   this.clear_list();
  },
  on_remove: function() {
   if(this.selection.count) {
    this.tree.beginUpdateBatch();
    for(var i=this.files.length-1;i>=0;--i) {
     if(this.selection.isSelected(i)) {
      this.files.splice(i,1);
      this.rowCount--;
     }
    }
    this.tree.endUpdateBatch();
    this.selection.clearSelection();
   }
  },
  on_add: function() {
   var ifp = Components.interfaces.nsIFilePicker;
   var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(ifp);
   fp.init(window, "Select a File", ifp.modeOpenMultiple);
   fp.appendFilters(ifp.filterImages);
   var rv = fp.show();
   if(rv==ifp.returnOK) {
    var ff = fp.files;
    while(ff.hasMoreElements()) {
     var f = ff.getNext();
     f.QueryInterface(Components.interfaces.nsIFile);
     this.add(f.path);
    }
   }
  },
  on_cmd_open: function(ev) {
   if(this.selection.currentIndex<0) return;
   var f = this.files[this.selection.currentIndex];
   if(f.photoid) {
    this.fireflix.openTab(
     this.fireflix.flickr.make_uploader_edit_url(f.photoid)
    );
   }else{
    this.fireflix.openTab( 'file://'+f.file);
   }
  }
 },

 on_set_props: function() {
  var pset = this.photosets.sets[this.photosets.selection.currentIndex];
  window.openDialog(
   "chrome://fireflix/content/photoset-props.xul",
   null, "dependent,modal,dialog,chrome", this,
   pset );
  if(pset.dirty) {
   var that = this;
   this.flickr.api_call_json(
    {
     method: 'flickr.photosets.editMeta',
     auth_token: 'default',
     photoset_id: pset.id,
     title: pset.title,
     description: pset.description
    }, function(x,j) {
     pset.dirty = false;
     that.flickr.api_call_json(
      {
       method: 'flickr.photosets.getPhotos',
       auth_token: 'default',
       photoset_id: pset.id
      }, function(x,j) {
       var pp = j.photoset.photo;
       var phids = new Array();
       var priph = null;
       for(var i in pp) {
        var pid = pp[i].id;
	phids.push(pid);
	if(pid==pset.primary && pp[i].isprimary) priph = pid;
       }
       if(priph) {
	that.flickr.api_call_json(
	 {
	  method: 'flickr.photosets.editPhotos',
	  auth_token: 'default',
	  photoset_id: pset.id,
	  primary_photo_id: priph,
	  photo_ids: phids.join(',')
	 }, function() { }, function(x,s,c,m) { /* flickr.photosets.editPhotos */
	  that.flickr_failure(x,s,c,m);
	 }
	);
       }
      }, function(x,s,c,m) { /* flickr.photosets.getPhotos */
       that.flickr_failure(x,s,c,m);
      }
     );
    }, function(x,s,c,m) { /* flickr.photosets.editMeta */
     that.flickr_failure(x,s,c,m);
    }
   );
  }
 },
 on_refresh_sets: function() {
  this.refresh_sets();
 },
 on_cmd_sets_html: function(csfx,ev) {
  var uti = csfx.charAt(0); var utl = csfx.charAt(1);
  var rv = this.build_html(this.photoset.photos,uti,utl);
  this.popup_content(rv);
 },
 on_cmd_setphotos_html: function(csfx,ev) {
  var uti = csfx.charAt(0); var utl = csfx.charAt(1);
  var rv = '';
  for(var p in this.photoset.photos) {
   if(this.photoset.selection.isSelected(p))
    rv += this.photo_html(this.photoset.photos[p],uti,utl)+'\n';
  }
  this.popup_content(rv);
 },

 on_cmd_uploads_html: function(csfx,ev) {
  var uti = csfx.charAt(0); var utl = csfx.charAt(1);
  var pids = new Array();
  for(var f in this.uploads.files) {
   if(this.uploads.selection.isSelected(f))
    if(this.uploads.files[f].photoid)
     pids.push(this.uploads.files[f].photoid);
  }
  var pp = this.uploads.rowCount*2; if(pp>500) pp = 500;
  var _this = this;
  this.flickr.api_call(
   {
    method: 'flickr.photos.search',
    auth_token: 'default',
    extras: 'original_format',
    user_id: 'me',
    per_page: pp
   },
   function(xr) {
    var x = xr.responseXML;
    var rv = '';
    for(var pn in pids) {
     var p = pids[pn];
     var pp = new Photo(xp_node('/rsp/photos/photo[@id='+p+']',x));
     rv += _this.photo_html(pp,uti,utl)+'\n';
    }
    _this.popup_content(rv);
   }, function(x,s,c,m) {
    _this.flickr_failure(x,s,c,m);
   }
  );
 },

 /*
  *
  */
 foundphotos: {
  fireflix: null,
  init: function(f) {
   this.fireflix = f;
   pull_elements(this,document,[
    'search_for','search_tags','search_mine',
    'searchresult_props','search_photo',
    'searchresult_title','searchresult_description',
    'search_page','cmd_search_prev_page','cmd_search_next_page'
   ]);
   document.getElementById('searchresults').view = this;
  },
  photos: new Array(),
  rowCount: 0,
  getCellText: function(r,c) {
   var p = this.photos[r];
   if(c.id=='sr_title') return p.title;
   return c.id;
  },
  setTree: function(t) { this.tree = t },
  isContainer: function(r) { return false },
  isSeparator: function(r) { return false },
  isSorted: function(r) { return false },
  getLevel: function(r) { return 0 },
  getImageSrc: function(r,c) { return null },
  getRowProperties: function(r,p) { },
  getCellProperties: function(cid,cel,p) { },
  getColumnProperties: function(cid,cel,p) { },
  cycleHeader: function(cid,e) { },
  getParentIndex: function(r) { return -1 },
  drop: function(r,o) { },
  canDropBeforeAfter: function(r,b) { return false },

  import_json: function(jp) {
   this.selection.clearSelection();
   this.selection.currentIndex=-1;
   this.searchresult_props.hidden=true;
   this.tree.beginUpdateBatch();
   this.photos = new Array();
   for(var i in jp) {
    this.photos.push(new Photo(jp[i]));
   }
   this.rowCount = this.photos.length;
   this.tree.endUpdateBatch();
  },
  paging: {
   pars: null,
   page: null, pages: null, perpage: null, total: null
  },
  search_photos: function() {
   var pars = {
    method: 'flickr.photos.search',
    auth_token: 'default',
    extras: 'license,date_upload,date_taken,owner_name,icon_server,original_format,last_update,geo'
   };
   if(this.search_mine.checked)
    pars.user_id='me';
   if(this.search_tags.checked) {
    pars.tags=this.search_for.value.split(/ +/).join(',');
   }else{
    pars.text=this.search_for.value;
   }
   this.paging.pars = new Object();
   this.paging.page = null; this.paging.pages = null;
   this.paging.perpage = null; this.paging.total = null;
   for(var p in pars) this.paging.pars[p] = pars[p];
   this.perform_search(pars);
  },
  perform_search: function(p) {
   var that = this;
   this.fireflix.flickr.api_call_json( p,
    function(x,j) {
     that.import_json(j.photos.photo);
     that.tree.ensureRowIsVisible(0);
     var pp=j.photos;
     that.paging.page = pp.page; that.paging.pages = pp.pages;
     that.paging.perpage = pp.perpage;
     that.paging.total = pp.total;
     that.update_paging();
     that.on_select();
    }, function(x,s,c,m) {
     that.fireflix.flickr_failure(x,s,c,m);
    }
   );
  },
  on_cmd_prev: function(ev) {
   var pars = new Object();
   for(var p in this.paging.pars) pars[p] = this.paging.pars[p];
   pars.page=this.paging.page-1; pars.per_page=this.paging.perpage;
   this.perform_search(pars);
  },
  on_cmd_next: function(ev) {
   var pars = new Object();
   for(var p in this.paging.pars) pars[p] = this.paging.pars[p];
   pars.page=this.paging.page+1; pars.per_page=this.paging.perpage;
   this.perform_search(pars);
  },
  update_paging: function() {
   if(! (this.paging.pars && this.paging.page && this.paging.pages) ) {
    this.search_page.value=''; this.search_page.hidden = true;
    this.cmd_search_prev_page.setAttribute('disabled','true');
    this.cmd_search_next_page.setAttribute('disabled','true');
   }else{
    this.search_page.value=this.fireflix.loc_strings.getFormattedString('search_page',[this.paging.page,this.paging.pages]);
    this.search_page.hidden=false;
    this.cmd_search_prev_page.setAttribute('disabled',(this.paging.page>1)?'false':'true');
    this.cmd_search_next_page.setAttribute('disabled',(this.paging.page<this.paging.pages)?'false':'true');
   }
  },
  render_description_frame: function(content) {
   this.searchresult_description.innerHTML = '';
   if(content) {
    var dp = new DOMParser();
    var pd = dp.parseFromString(
     '<div xmlns="http://www.w3.org/1999/xhtml">'+content+'</div>', 'text/xml' );
    var de = pd.documentElement;
    if(de.tagName=='parsererror')
     this.searchresult_description.innerHTML=this.fireflix.loc_strings.getString('broken_description');
    else
     this.searchresult_description.appendChild(de);
    /* of all linking elements flickr only allows a */
    var as = this.searchresult_description.getElementsByTagName('a');
    for(var a=0;a<as.length;++a)
     as.item(a).setAttribute('target','_blank');
   }
  },
  on_select: function() {
   if(this.selection.currentIndex<0) {
    this.searchresult_props.hidden = true;
   }else{
    var p = this.photos[this.selection.currentIndex];
    if(!p) {
     this.searchresult_props.hidden = true;
    }else{
     this.search_photo.src = this.fireflix.flickr.make_photo_url(p,'t');
     this.searchresult_title.value = p.title;
     this.searchresult_title.tooltipText = p.title;
     this.render_description_frame(null);
     if(p.description==null && p.description==undefined) {
      var pid = p.id;
      var ci = this.selection.currentIndex;
      var that = this;
      this.fireflix.flickr.api_call_json(
       {
	method: 'flickr.photos.getInfo',
	auth_token: 'default',
	photo_id: p.id,
	secret: p.secret
       }, function(x,j) {
	var pp = that.photos[ci];
	if(ci==that.selection.currentIndex && pp.id==pid) {
	 pp.fromJSON_(j.photo);
	 that.render_description_frame(pp.description);
	}
       }, function(x,s,c,m) {
	that.fireflix.flickr_failure(x,s,c,m);
       }
      );
      this.searchresult_props.hidden = false;
     }else{
      this.render_description_frame(p.description);
     }
    }
   }
  },
  on_cmd_open: function(ev) {
   if(this.selection.currentIndex<0) return;
   var p = this.photos[this.selection.currentIndex];
   if(!p.id) return;
   this.fireflix.openTab(this.fireflix.flickr.make_photo_url(p,'p'));
  }
 },

 photo_html: function(p,i,l) {
  // TODO: add alt/title when possible
  var rv = 
   '<a href="'+this.flickr.make_photo_url(p,l)+'">' +
   '<img src="'+this.flickr.make_photo_url(p,i)+'" />'+
   '</a>';
  return rv;
 },
 build_html: function(photos,uti,utl) {
  var rv = '';
  for(var i in photos) {
   var p = photos[i];
   rv += this.photo_html(p,uti,utl)+'\n';
  }
  return rv;
 },

 popup_content: function(s) {
  window.openDialog(
   "chrome://fireflix/content/generated-content.xul",
   null, "dialog,chrome", this, s );
 },
 copy_to_clipboard: function(s) {
  var ch = Components.classes["@mozilla.org/widget/clipboardhelper;1"]
   .getService(Components.interfaces.nsIClipboardHelper);
  ch.copyString(s); 
 },
 openTab: function(l) {
  var wm = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(
   Components.interfaces.nsIWindowMediator );
  var bw = wm.getMostRecentWindow('navigator:browser');
  var b = bw.getBrowser();
  var t = b.addTab(l);
  b.selectedTab = t;
 },

 build_menus: function() {
  this.append_html_menu(
   document.getElementById('sets_html_menu'),
   'stm_','m_bop','cmdset_sets','cmd_sets_html'
  );
  this.append_html_menu(
   document.getElementById('setphotos_html_menu'),
   'stm_','m_bop','cmdset_setphotos','cmd_setphotos_html'
  );
  this.append_html_menu(
   document.getElementById('uploads_html_menu'),
   'stm_','m_bop','cmdset_uploads','cmd_uploads_html'
  );
  return;
 },
 append_html_menu: function(m,imgt,lnkt,csid,cpfx) {
  var mp = m.appendChild(document.createElement('menupopup'));
  var t;
  t=mp.appendChild(document.createElement('menuitem'));
  t.setAttribute('label',this.loc_strings.getString('menutitle_Images'));
  t.setAttribute('class','menuhead');t.setAttribute('disabled','true');
  mp.appendChild(document.createElement('menuseparator'));
  var cs = document.getElementById(csid);
  for(var iti=0;iti<imgt.length;++iti) {
   t = mp.appendChild(document.createElement('menu'));
   t.setAttribute('label',this.loc_strings.getString('urltype_'+imgt.charAt(iti)));
   var smp = t.appendChild(document.createElement('menupopup'));
   t=smp.appendChild(document.createElement('menuitem'));
   t.setAttribute('label',this.loc_strings.getString('menutitle_Links'));
   t.setAttribute('class','menuhead');t.setAttribute('disabled','true');
   smp.appendChild(document.createElement('menuseparator'));
   for(var lti=0;lti<lnkt.length;++lti) {
    var csfx = imgt.charAt(iti)+lnkt.charAt(lti);
    t=smp.appendChild(document.createElement('menuitem'));
    t.setAttribute('label',this.loc_strings.getString('urltype_'+lnkt.charAt(lti)));
    t.setAttribute('command',cpfx+'_'+csfx);
    t=cs.appendChild(document.createElement('command'));
    t.setAttribute('id',cpfx+'_'+csfx);
    t.setAttribute('oncommand','fireflix.on_'+cpfx+"('"+csfx+"',event)");
   }
  }
  return mp;
 },

 flickr_failure: function(x,s,c,m) {
  if(c==98) { // Invalid auth token
   this.flickr.reset_token();
   this.set_auth_state(false,false);
   return;
  }
  // TODO: is that beauty?
  alert('flickr api call failed\n'+c+' '+m);
 }

};
