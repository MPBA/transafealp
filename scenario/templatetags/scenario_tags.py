# -*- encoding: utf-8 -*-
__author__ = 'ernesto (arbitrio@fbk.eu)'
from django import template

register = template.Library()

@register.filter(name='splitstr')
def splitstr(value, splitter):
    ext = str(value).split(splitter)[-1]
    return ext

