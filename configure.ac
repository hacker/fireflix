AC_INIT([fireflix], [0.0.6.2], [fireflix-bugs@klever.net])
AC_CONFIG_SRCDIR([install.rdf.in])
AM_INIT_AUTOMAKE([dist-bzip2])
AC_SUBST([MOZ_EXT_ID],[{4269f719-86de-4668-b8ad-04752c23a69e}])

AC_PATH_PROG([ZIP],[zip],[false])
if test "${ZIP}" = "false" ; then
 AC_MSG_ERROR([zip is required to produce packaged extension])
fi
AC_PATH_PROG([XSLTPROC],[xsltproc],[true])

AC_SUBST([xpidir],[\${top_builddir}/xpi])
AC_SUBST([xpichromedir],[\${xpidir}/chrome])
AC_SUBST([xpichromecontentdir],[\${xpichromedir}/content])
AC_SUBST([xpichromelocaledir],[\${xpichromedir}/locale])

COPYING="`sed -e 's/\\"/\\&quot;/g' -e 's,$,<br/>,g' -e 's/(c)/\\&#xa9;/g' ${srcdir}/COPYING|tr '\n' ' '`"
AC_SUBST([COPYING])

AC_CONFIG_FILES([
 Makefile
  install.rdf
  update-template.rdf
 content/Makefile
  content/autoconf.dtd
 locale/Makefile
])
AC_OUTPUT
