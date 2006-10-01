/*
 * convert unicode string to utf-8 representation.
 * needed for correct md5 hash calculation.
 */
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

/*
 * extract xpath-specified string value
 */
function xp_str(xp,x) {
 var rv = x.evaluate(
  xp, x, null, XPathResult.STRING_TYPE, null );
 return rv.stringValue;
}
/*
 * extract xpath-specified node
 */
function xp_node(xp,x) {
 var rv = x.evaluate(
  xp, x, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null );
 return rv.singleNodeValue;
}
/*
 * extract xpath-specified ordered set of nodes
 */
function xp_nodes(xp,x) {
 return x.evaluate(
  xp, x, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
}

/*
 * pull in elements into documents as a member variables
 */
function pull_elements(th,d,els) {
 for(var e in els) {
  var en=els[e];
  th[en] = d.getElementById(en);
 }
}
