# -*- encoding: utf-8 -*-
__author__ = 'ernesto (arbitrio@fbk.eu)'

from django import template
from django.core.urlresolvers import reverse

register = template.Library()

@register.simple_tag
def active(request, url):
    if reverse(url) == request.path:
        active = 'active'
    else:
        active = ''
    return active

@register.simple_tag
def active_pattern(request, pattern):
    import re
    if re.search(pattern, request.path):
        return 'active'
    return ''