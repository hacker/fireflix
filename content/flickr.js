/*
 * Photoset
 */

function Photoset(s) {
 if(s instanceof Photoset) {
   for(var p in s) this[p]=s[p];
 }else
  this.fromNode(s);
}
Photoset.prototype = {
 id: null,
 primary: null,
 secret: null,
 server: null,
 photos: null,
 title: null,
 description: null,
 fromNode: function(n) {
  this.id = n.getAttribute('id');
  this.primary = n.getAttribute('primary');
  this.secret = n.getAttribute('secret');
  this.server = n.getAttribute('server');
  this.photos = n.getAttribute('photos');
  this.title = n.getElementsByTagName('title').item(0).firstChild.nodeValue;
  this.description = n.getElementsByTagName('description').item(0).firstChild;
  if(this.description) this.description = this.description.nodeValue;
 }
};

/*
 * Photo
 */
function Photo(s) {
 if(s instanceof Photo) {
  for(var p in s) this[p]=s[p];
 }else
  this.fromNode(s);
}
Photo.prototype = {
 id: null, secret: null,
 server: null,
 title: null,
 isprimary: null,
 license: null,
 dateupload: null, datetaken: null, datetakengranularity: null,
 ownername: null,
 iconserver: null,
 originalformat: null,
 lastupdate: null,
 fromNode: function(n) {
  this.id = n.getAttribute('id'); this.secret = n.getAttribute('secret');
  this.server = n.getAttribute('server');
  this.title = n.getAttribute('title');
  this.isprimary = n.getAttribute('isprimary');
  this.license = n.getAttribute('license');
  this.dateupload = n.getAttribute('dateupload');
  this.datetaken = n.getAttribute('datetaken'); this.datetakengranularity = n.getAttribute('datetakengranularity');
  this.ownername = n.getAttribute('ownername');
  this.iconserver = n.getAttribute('iconserver');
  this.originalformat = n.getAttribute('originalformat');
  this.lastupdate = n.getAttribute('lastupdate');
 },
 fromNode_: function(n) {
  var t;
  // TODO: @rotation @isfavorite
  this.owner = {};
  t = n.getElementsByTagName('owner').item(0);
  if(t) {
   this.owner.nsid=t.getAttribute('nsid');
   this.owner.username=t.getAttribute('username');
   this.owner.realname=t.getAttribute('realname');
   this.owner.location=t.getAttribute.location;
  }
  t = n.getElementsByTagName('description').item(0);
  if(t && t.firstChild) {
   this.description = t.firstChild.nodeValue;
  }
  // TODO: visibility/@ispublic visibility/@isfriend visibility/@isfamily 
  // TODO: dates/@posted dates/@taken dates/@takengranularity dates/@lastupdate
  // TODO: permissions/@permcomment permsiions/@permaddmeta
  // TODO: editability/@canaddcomment editability/@canaddmeta
  // TODO: comments
  // TODO: notes/note/@id notes/note/@author notes/note/@authorname
  // TODO: notes/note/@x notes/note/@y notes/note/@w notes/note/@h
  // TODO: notes/note
  // TODO: tags/tag/@id tags/tag/@author tags/tag/@raw tags/tag
  // TODO: urls/url/@type urls/url
 }
};

function toutf8(ucode) {
 var rv = '';
 for(var i=0;i<ucode.length;++i) {
  var cc = ucode.charCodeAt(i);
  if(cc<=0x7F)
   rv += ucode.charAt(i);
  else if(cc<=0x7ff)
   rv += String.fromCharCode(
    0xc0|((cc>> 6)&0x1f),
    0x80|( cc     &0x3f) );
  else if(cc<=0xffff)
   rv += String.fromCharCode(
    0xe0|((cc>>12)&0x0f),
    0x80|((cc>> 6)&0x3f),
    0x80|( cc     &0x3f) );
  else if(cc<=0x1fffff)
   rv += String.fromCharCode(
    0xf0|((cc>>18)&0x07),
    0x80|((cc>>12)&0x3f),
    0x80|((cc>> 6)&0x3f),
    0x80|( cc     &0x3f) );
  else if(cc<=0x03ffffff)
   rv += String.fromCharCode(
    0xf8|((cc>>24)&0x03),
    0x80|((cc>>18)&0x3f),
    0x80|((cc>>12)&0x3f),
    0x80|((cc>> 6)&0x3f),
    0x80|( cc     &0x3f) );
  else if(cc<=0x7fffffff)
   rv += String.fromCharCode(
    0xfc|((cc>>30)&0x01),
    0x80|((cc>>24)&0x3f),
    0x80|((cc>>18)&0x3f),
    0x80|((cc>>12)&0x3f),
    0x80|((cc>> 6)&0x3f),
    0x80|( cc     &0x3f) );
 }
 return rv;
}
function xp_str(xp,x) {
 var rv = x.evaluate(
  xp, x, null, XPathResult.STRING_TYPE, null );
 return rv.stringValue;
}
function xp_node(xp,x) {
 var rv = x.evaluate(
  xp, x, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null );
 return rv.singleNodeValue;
}

function Flickr() { }
Flickr.prototype = {

 rest_url: 'http://www.flickr.com/services/rest/',
 auth_url: 'http://flickr.com/services/auth/',
 photo_url: 'http://static.flickr.com/',
 photos_url: 'http://www.flickr.com/photos/',
 upload_url: 'http://www.flickr.com/services/upload/',

 api_sig: function(paramstr) {
  return MD5(toutf8(this.api_shs+paramstr));
 },
 api_call_url: function(params,url) {
  params.api_key = this.api_key;
  var pp = new Array();
  for(var p in params) {
   pp.push(p);
  }
  var pstr = '';
  var rv = (url?url:this.rest_url)+'?';
  for(var p in pp.sort()) {
   var pn = pp[p];
   pstr += pn+params[pn];
   rv += pn+'='+params[pn]+'&';
  }
  rv += 'api_sig='+this.api_sig(pstr);
  return rv;
 },
 api_call: function(params, on_success, on_failure) {
  if(params.auth_token == 'default')
   params.auth_token = this.token;
  var x = new XMLHttpRequest();
  x.open("GET",this.api_call_url(params));
  x.onreadystatechange=function() {
   if(x.readyState!=4) return false;
   if(x.status==200) {
    var stat = x.responseXML.firstChild.getAttribute('stat');
    if(stat=='ok') {
     if(on_success) on_success(x);
    }else{
     var e = x.responseXML.getElementsByTagName('err').item(0);
     var ecode = e.getAttribute('code');
     var emsg = e.getAttribute('msg');
     dump(params.method+' failed: '+ecode+' '+emsg+'\n');
     if(on_failure) on_failure(x,stat,ecode,emsg);
    }
   }else{
    if(on_failure) on_failure(x);
   }
   return true;
  }
  x.send(null);
  return true;
 },

 frob: null,
 authorize_0: function(on_s, on_f) {
  var _this = this;
  this.api_call(
   { method: 'flickr.auth.getFrob' },
   function(x) {
    _this.frob = xp_str('/rsp/frob',x.responseXML);
    var u = _this.api_call_url(
     { frob: _this.frob, perms: 'delete' }, _this.auth_url );
    var wm = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(
     Components.interfaces.nsIWindowMediator );
    var bw = wm.getMostRecentWindow('navigator:browser');
    var b = bw.getBrowser();
    var t = b.addTab(u);
    b.selectedTab = t;
    if(on_s) on_s();
   }, function(x,s,c,m) {
    if(on_f) on_f(x,s,c,m);
   }
  );
 },
 token: null,
 perms: null,
 user: null,
 authorize_1: function(on_s, on_f) {
  var _this = this;
  this.api_call(
   { method: 'flickr.auth.getToken', frob: this.frob },
   function(x) {
    _this.token = xp_str('/rsp/auth/token',x.responseXML);
    _this.perms = xp_str('/rsp/auth/perms',x.responseXML);
    var u = xp_node('/rsp/auth/user',x.responseXML);
    _this.user = {
     nsid: u.getAttribute('nsid'),
     username: u.getAttribute('username'),
     fullname: u.getAttribute('fullname')
    };
    if(on_s) on_s(x);
   }, function(x,s,c,m) {
    if(on_f) on_f(x,s,c,m);
   }
  );
 },

 prefs: Components.classes['@mozilla.org/preferences-service;1'].getService(
  Components.interfaces.nsIPrefBranch
 ),
 prefs_root: 'net.klever.kin.flickr',
 save_token: function() {
  // TODO: don't clear when there's nothing to clear or catch exceptions
  if(this.token)
   this.prefs.setCharPref(this.prefs_root+'.auth_token',this.token);
  else
   this.prefs.clearUserPref(this.prefs_root+'.auth_token');
  if(this.perms)
   this.prefs.setCharPref(this.prefs_root+'.auth_perms',this.perms);
  else
   this.prefs.clearUserPref(this.prefs_root+'.auth_perms');
  if(this.user && this.user.nsid!=null && this.user.nsid!=undefined)
   this.prefs.setCharPref(this.prefs_root+'.auth_user.nsid',this.user.nsid);
  else
   this.prefs.clearUserPref(this.prefs_root+'.auth_user.nsid');
  if(this.user && this.user.username!=null && this.user.username!=undefined)
   this.prefs.setCharPref(this.prefs_root+'.auth_user.username',this.user.username);
  else
   this.prefs.clearUserPref(this.prefs_root+'.auth_user.username');
  if(this.user && this.user.fullname!=null && this.user.fullname!=undefined)
   this.prefs.setCharPref(this.prefs_root+'.auth_user.fullname',this.user.fullname);
  else
   this.prefs.clearUserPref(this.prefs_root+'.auth_user.fullname');
 },
 _reset_token: function() {
  this.token = null; this.perms = null; this.user = null;
  return false;
 },
 load_token: function() {
  try {
   if(this.prefs.getPrefType(this.prefs_root+'.auth_token')!=this.prefs.PREF_STRING)
    return this._reset_token();
   this.token = this.prefs.getCharPref(this.prefs_root+'.auth_token');
   if(this.prefs.getPrefType(this.prefs_root+'.auth_perms')!=this.prefs.PREF_STRING)
    return this._reset_token();
   this.perms = this.prefs.getCharPref(this.prefs_root+'.auth_perms');
   if(this.prefs.getPrefType(this.prefs_root+'.auth_user.nsid')!=this.prefs.PREF_STRING)
    return this._reset_token();
   this.user = new Object();
   this.user.nsid = this.prefs.getCharPref(this.prefs_root+'.auth_user.nsid');
   if(this.prefs.getPrefType(this.prefs_root+'.auth_user.username')!=this.prefs.PREF_STRING)
    return this._reset_token();
   this.user.username = this.prefs.getCharPref(this.prefs_root+'.auth_user.username');
   if(this.prefs.getPrefType(this.prefs_root+'.auth_user.fullname')!=this.prefs.PREF_STRING)
    return this._reset_token();
   this.user.fullname = this.prefs.getCharPref(this.prefs_root+'.auth_user.fullname');
  }catch(e) { return this._reset_token(); }
  return true;
 },
 reset_token: function() {
  this._reset_token();
  this.save_token();
 },

 get_photo_url: function(ser,id,sec,sfx,ext) {
  var rv = this.photo_url + ser + '/' + id + '_' + sec;
  if(sfx && sfx!='_') rv += '_'+sfx;
  rv += ext?'.'+ext:'.jpg';
  return rv;
 },
 get_image_url: function(o,sfx) {
  return this.get_photo_url(
   o.server,
   (o instanceof Photoset)? o.primary : o.id,
   o.secret,
   sfx,
   (sfx=='o')?o.originalformat:null
  );
 },
 get_photo_page_url: function(p) {
  if(p instanceof Photo) // TODO: half wrong, what if no owner?
   return this.photos_url + (p.owner.nsid?p.owner.nsid:this.user.nsid) + '/' + p.id;
  else // TODO: take owner into account?
   return this.photos_url + this.user.nsid + '/' + p;
 },
 make_photo_url: function(p,sfx) {
  if(sfx=='p')
   return this.get_photo_page_url(p);
  else
   return this.get_image_url(p,sfx);
 },

 upload_file: function(f,fa,on_success,on_failure) {
  try {
   var fi = Components.classes["@mozilla.org/file/local;1"]
    .createInstance(Components.interfaces.nsILocalFile);
   fi.initWithPath( f );
   var st = Components.classes["@mozilla.org/network/file-input-stream;1"]
    .createInstance(Components.interfaces.nsIFileInputStream);
   st.init(fi,0x01,00004,null);
   var bis = Components.classes["@mozilla.org/binaryinputstream;1"]
    .createInstance(Components.interfaces.nsIBinaryInputStream);
   bis.setInputStream(st);

   // allocate and initialize temp storage string
   var pbs = Components.classes["@mozilla.org/storagestream;1"]
    .createInstance(Components.interfaces.nsIStorageStream);
   pbs.init(1024,10000000,null);
   // create output stream
   var pbos = pbs.getOutputStream(0);
   // and a binaryoutputstream interface
   var pbbos = Components.classes["@mozilla.org/binaryoutputstream;1"]
    .createInstance(Components.interfaces.nsIBinaryOutputStream);
   pbbos.setOutputStream(pbos);

   /* create POST body */
   var boundarytoken = 'kadaroloongazaduviaxamma';
   var boundary = '--'+boundarytoken;
   var b = '';

   var parms = { api_key: this.api_key, auth_token: this.token };
   for(var p in fa) parms[p] = fa[p];
   var pns = new Array();
   for(var p in parms) pns.push(p);
   var pstr = '';
   for(var p in pns.sort()) {
    var pn = pns[p];
    pstr += pn+parms[pn];
    b += boundary+'\nContent-Disposition: form-data; name="'+pn+'"\n\n'+toutf8(parms[pn])+'\n';
   }
   b += boundary+'\nContent-Disposition: form-data; name="api_sig"\n\n'+this.api_sig(pstr)+'\n';
   b += boundary+'\nContent-Disposition: form-data; name="photo"; filename="'+f+'"\nContent-Type: image/jpeg\nContent-Transfer-Encoding: binary\n\n';
   pbbos.writeBytes(b,b.length);
   var bisbytes = bis.available();
   pbbos.writeBytes(bis.readBytes(bisbytes),bisbytes);
   pbbos.writeBytes('\n'+boundary+'--',3+boundary.length); bis.close(); st.close();

   pbbos.close(); pbos.close();

   var x = new XMLHttpRequest();
   x.open("POST",this.upload_url);
   x.setRequestHeader('Content-Type', 'multipart/form-data; boundary="'+boundarytoken+'"');
   x.setRequestHeader('Connection','close');
   x.setRequestHeader('Content-Length',b.length);
   x.onreadystatechange=function() {
    if(x.readyState!=4) return false;
    if(x.status==200) {
     var stat = x.responseXML.firstChild.getAttribute('stat');
     if(stat=='ok') {
      var pid = xp_str('/rsp/photoid',x.responseXML);
      if(on_success) on_success(x,pid);
     }else{
      var e = x.responseXML.getElementsByTagName('err').item(0);
      var ecode = e.getAttribute('code');
      var emsg = e.getAttribute('msg');
      dump('upload failed: '+ecode+' '+emsg+'\n');
      if(on_failure) on_failure(x,stat,ecode,emsg);
     }
    }else{
     if(on_failure) on_failure(x);
    }
    return true;
   };
   x.send(pbs.newInputStream(0));
  }catch(e) {
   if(on_failure) on_failure(e,null,-1,e.message);
  }
 }

};
