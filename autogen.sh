#!/bin/sh
WANT_AUTOMAKE=1.8
export WANT_AUTOMAKE
aclocal \
&& automake -a \
&& autoconf \
&& ./configure "$@"
