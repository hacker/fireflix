xpichromecontent_DATA = \
	autoconf.dtd \
	browser.xul about.xul fireflix-panel.xul photoset-props.xul \
	generated-content.xul copying.xul \
	photoset-props.js fireflix.js flickr.js util.js md5.js \
	generated-content.js \
	fireflix.css \
	background.jpeg \
	help.xml

sized_icons = \
	$(addsuffix .png, \
	 fireflix \
	)

nobase_xpichromecontent_DATA = \
	$(addprefix icons/, \
	 $(addprefix 16x16/,${sized_icons}) \
	 $(addprefix 32x32/,${sized_icons}) \
	) \
	icons/16x16/toolbar-button.png

EXTRA_DIST = \
	${xpichromecontent_DATA} ${nobase_xpichromecontent_DATA}
