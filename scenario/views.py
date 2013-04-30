# -*- encoding: utf-8 -*-
__author__ = 'ernesto (arbitrio@fbk.eu)'

from django.shortcuts import render_to_response
from django.contrib.auth.decorators import login_required
from django.template import RequestContext
from .models import Scenario
from utility import Membership

@login_required
def scenario_list(request):
    managing_auth = Membership(request.user).membership_auth
    scenarios = Scenario.objects.filter(managing_authority=managing_auth).order_by('-id', 'name')
    context = {'ma': managing_auth, 'scenarios': scenarios}
    return render_to_response('scenario/scenario_list.html', context, context_instance=RequestContext(request))

@login_required
def scenario_add(request):
    context = {}
    return render_to_response('scenario/scenario_add.html', context, context_instance=RequestContext(request))