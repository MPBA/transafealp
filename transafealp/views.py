# -*- encoding: utf-8 -*-
__author__ = 'ernesto'

#This file contains only the views for the main app. It's made just to render an home page for the project
from django.shortcuts import render_to_response
from django.contrib.auth.decorators import login_required
from django.template import RequestContext
from scenario.models import ManagingAuthority
from scenario.utility import Membership

@login_required
def main_view(request):
    try:
        managing_authority = Membership(request.user).membership_auth
    except ManagingAuthority.DoesNotExists:
        managing_authority = ""
    request.session["ma"] = managing_authority
    context = {'ma': managing_authority}
    return render_to_response('transafealp/home_page.html', context, context_instance=RequestContext(request))


