# -*- encoding: utf-8 -*-
__author__ = 'ernesto'

#This file contains only the views for the main app. It's made just to render an home page for the project
from django.shortcuts import render_to_response
from django.contrib.auth.decorators import login_required
from django.template import RequestContext

@login_required
def main_view(request):
    context = {}
    return render_to_response('transafealp/home_page.html', context, context_instance=RequestContext(request))


