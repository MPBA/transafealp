# Create your views here.
from datetime import datetime
from django.http import HttpResponse
from django.shortcuts import render_to_response
from django.contrib.auth.decorators import login_required
from django.template import RequestContext
import json
from scenario.models import Scenario

@login_required
def emergency(request, displaymode):
    context = {
        'displaymode': displaymode,
        'username': request.user
    }

    return render_to_response('jites/emergency.html', context, context_instance=RequestContext(request))

@login_required
def poll(request):
    # TODO implemented by real request on scenario log table. This is a demo.
    result = ({
        'type': 'event',
        'name': 'log',
        'data': {
            'id': request.user.id,
            'type': 'SYSTEM',
            'ts': datetime.now().strftime("%d/%m/%y %H:%M:%S.%f"),
            'username': str(request.user),
            'msg': 'System ready to accept connections'
        }
    },{
        'type': 'event',
        'name': 'log',
        'data': {
            'id': request.user.id,
            'type': 'TASK',
            'ts': datetime.now().strftime("%d/%m/%y %H:%M:%S.%f"),
            'username': str(request.user),
            'msg': 'New event <strong>CP/FF/10</strong>'
        }
    })
    j = json.dumps(result)
    return HttpResponse(j, content_type="application/json")

@login_required
def annotation(request):
    # TODO implemented by real request on scenario log table. This is a demo.
    result = ({
                  'success': 'true'
              })
    j = json.dumps(result)
    return HttpResponse(j, content_type="application/json")

@login_required
def start_event(request, scenario_id, type):
    scenario = Scenario.objects.get(pk=scenario_id)
    if type == 'visualization':
        #do something
        pass
    elif type == 'emergency':
        #do something
        pass