
var psetprops = {
 fireflix: null,
 photoset: null,
 pripic: null,

 settitle: null, setdesc: null,
 primarypic: null,
 photos: new Array(),
 init: function() {
  this.fireflix = window.arguments[0];
  this.photoset = window.arguments[1];
  this.settitle = document.getElementById('set_title');
  this.settitle.value = this.photoset.title;
  this.setdesc = document.getElementById('set_desc');
  this.setdesc.value = this.photoset.description;
  this.primarypic = document.getElementById('primary_picture');
  this.primarypic.src =
   this.fireflix.flickr.get_image_url( this.photoset, 't' );
  this.primarypic.hidden = false;
  this.picslist = document.getElementById('primary_picture_list');

  var _this = this;
  this.fireflix.flickr.api_call(
   {
    method: 'flickr.photosets.getPhotos',
    auth_token: 'default',
    photoset_id: this.photoset.id
   }, function(xr) {
    var x = xr.responseXML;
    var xp = x.evaluate(
     '/rsp/photoset/photo', x, null,
     XPathResult.ORDERED_NODE_ITERATOR_TYPE, null );
    _this.picslist.removeAllItems(); _this.photos= new Array();
    var n; while(n=xp.iterateNext()) {
     _this.photos.push(
      {
       id: n.getAttribute('id'),
       secret: n.getAttribute('secret'),
       server: n.getAttribute('server')
      }
     );
     var ni = _this.picslist.appendItem(
      n.getAttribute('title'), _this.photos.length-1
     );
     ni.setAttribute('command','cmd_select_picture');
     if(n.getAttribute('isprimary')==1) {
      _this.picslist.selectedItem = ni;
      _this.pripic = _this.photos[_this.photos.length-1];
     }
    }
    _this.picslist.hidden = false;
   }, function() { }
  );
 },
 on_select_picture: function(ev) {
  var epic = ev.explicitOriginalTarget;
  this.picslist.selectedItem = epic;
  var pic = this.photos[this.picslist.selectedItem.value];
  this.pripic = pic;
  this.primarypic.src =
   this.fireflix.flickr.get_photo_url(
    pic.server,
    pic.id,
    pic.secret,
    't'
   );
 },
 on_accept: function() {
  this.photoset.title =
   document.getElementById('set_title').value;
  this.photoset.description = 
   document.getElementById('set_desc').value;
  this.photoset.server = this.pripic.server;
  this.photoset.primary = this.pripic.id;
  this.photoset.secret = this.pripic.secret;
  this.photoset.dirty = true;
  return;
 }
};

