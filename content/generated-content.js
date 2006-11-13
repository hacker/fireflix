var generated = {
 fireflix: null,
 data: null,

 init: function() {
  this.fireflix = window.arguments[0];
  this.data = window.arguments[1];
  this.databox = document.getElementById('data');
  this.databox.value = this.data;
  this.databox.select();
 },
 copy: function() {
  var ch = Components.classes["@mozilla.org/widget/clipboardhelper;1"]
   .getService(Components.interfaces.nsIClipboardHelper);
  ch.copyString(this.data); 
 },
 nolf: function() {
  this.databox.value = this.data.replace(/[\r\n]/,'');
  document.getElementById('nolf').disabled = true;
 }
};
