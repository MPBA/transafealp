# Create your views here.
from datetime import datetime
from django.db import transaction, connection
from django.http import HttpResponse
from django.shortcuts import render_to_response
from django.contrib.auth.decorators import login_required
from django.template import RequestContext
import json
from scenario.models import Scenario, ScenarioSubcategory
from scenario.utility import Membership

@login_required
def dashboard(request, displaymode, event_id):
    context = {
        'displaymode': displaymode,
        'event_id': event_id,
        'username': request.user
    }

    return render_to_response('jites/dashboard.html', context, context_instance=RequestContext(request))

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
def select_event_location(request,scenario_id,type):
    cursor = connection.cursor()
    cursor.execute(
        "SELECT name, subcategory_id, description , ST_AsGeoJSON(ST_Transform(geom,900913)) FROM scenario WHERE id=%s",
        [scenario_id])
    row = cursor.fetchone()

    transaction.commit_unless_managed()
    category = ScenarioSubcategory.objects.get(pk=int(list(row)[1]))
    geometry = list(row)[3]
    context = {'scenario': list(row), 'scenario_id': scenario_id, 'category': category, 'geometry': geometry, 'type': type}
    return render_to_response('jites/select_event_location.html', context, context_instance=RequestContext(request))

@login_required
def start_event(request, scenario_id, type):
    point = request.GET['point']
    scenario = Scenario.objects.get(pk=scenario_id)

    if type == 'simulation':
        is_real = True
        pass
    elif type == 'emergency':
        is_real = False
        pass

    geom = 'SRID=900913;POINT({0})'.format(point)

    cursor = connection.cursor()
    cursor.execute(
        "select * from start_event(%s,%s,ST_Transform(%s::geometry,3035));",
        [scenario.name, is_real, geom])
    row = cursor.fetchone()

    transaction.commit_unless_managed()

    result = ({
                  'success': 'true'
              })

    j = json.dumps(result)

    return HttpResponse(j, content_type="application/json")