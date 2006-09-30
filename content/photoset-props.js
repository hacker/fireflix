
var psetprops = {
 fireflix: null,
 photoset: null,
 pripic: null,

 photos: new Array(),
 init: function() {
  this.fireflix = window.arguments[0];
  this.photoset = window.arguments[1];
  pull_elements(this,document,[
   'set_title','set_desc','primary_picture',
   'primary_picture_list'
  ]);
  this.set_title.value = this.photoset.title;
  this.set_desc.value = this.photoset.description;
  this.primary_picture.src =
   this.fireflix.flickr.get_image_url( this.photoset, 't' );
  this.primary_picture.hidden = false;

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
    _this.primary_picture_list.removeAllItems(); _this.photos= new Array();
    var n; while(n=xp.iterateNext()) {
     _this.photos.push(
      {
       id: n.getAttribute('id'),
       secret: n.getAttribute('secret'),
       server: n.getAttribute('server')
      }
     );
     var ni = _this.primary_picture_list.appendItem(
      n.getAttribute('title'), _this.photos.length-1
     );
     ni.setAttribute('command','cmd_select_picture');
     if(n.getAttribute('isprimary')==1) {
      _this.primary_picture_list.selectedItem = ni;
      _this.pripic = _this.photos[_this.photos.length-1];
     }
    }
    _this.primary_picture_list.hidden = false;
   }, function() { }
  );
 },
 on_select_picture: function(ev) {
  var epic = ev.explicitOriginalTarget;
  this.primary_picture_list.selectedItem = epic;
  var pic = this.photos[this.primary_picture_list.selectedItem.value];
  this.pripic = pic;
  this.primary_picture.src =
   this.fireflix.flickr.get_photo_url(
    pic.server,
    pic.id,
    pic.secret,
    't'
   );
 },
 on_accept: function() {
  this.photoset.title = this.set_title.value;
  this.photoset.description = this.set_desc.value;
  this.photoset.server = this.pripic.server;
  this.photoset.primary = this.pripic.id;
  this.photoset.secret = this.pripic.secret;
  this.photoset.dirty = true;
  return;
 }
};

