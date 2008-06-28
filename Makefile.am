SUBDIRS = content locale

xpi_DATA = \
	install.rdf \
	AUTHORS COPYING NEWS

EXTRA_DIST = NEWS NEWS.xml NEWS.xsl chrome.manifest

XPI=${PACKAGE}-${VERSION}.xpi

xpi: ${XPI}

${XPI}: install
	test -z "${NO_UPDATE}" || sed -i -e '/em:update\(URL\|Key\)/d' ${xpidir}/install.rdf
	cd ${xpichromedir} \
	&& ${ZIP} -r -m ${PACKAGE}.jar */
	cd ${xpidir} \
	&& ${ZIP} -r @abs_builddir@/$@ .

update.rdf: update-template.rdf ${XPI}
	sed -e "s/<!--SHA1-->/$$(sha1sum ${XPI}|cut -d\  -f1)/" <$< >$@

install-data-local: ${xpidir}/chrome.manifest

${xpidir}/chrome.manifest: chrome.manifest Makefile
	sed \
	 -e 's,^content[[:space:]]\+\([^[:space:]]\+\)[[:space:]]\+\([^[:space:]]\+\)$$,content \1 jar:chrome/${PACKAGE}.jar!/\2,' \
	 -e 's,^locale[[:space:]]\+\([^[:space:]]\+\)[[:space:]]\+\([^[:space:]]\+\)[[:space:]]\+\([^[:space:]]\+\)$$,locale \1 \2 jar:chrome/${PACKAGE}.jar!/\3,' \
	 $< >$@

clean-local:
	rm -rf ${xpidir} ${XPI}

all-local: NEWS

NEWS: NEWS.xsl NEWS.xml
	${XSLTPROC} -o $@ NEWS.xsl NEWS.xml

mozextptr: ${MOZ_EXT_ID}
${MOZ_EXT_ID}:
	echo @abs_srcdir@ >$@
