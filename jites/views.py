# Create your views here.
from datetime import datetime
from django.db import transaction, connection
from django.http import HttpResponse
from django.shortcuts import render_to_response, HttpResponse
from django.contrib.auth.decorators import login_required
from django.template import RequestContext
import json
from scenario.models import Scenario, ScenarioSubcategory
from django.views.generic.detail import BaseDetailView
from mixin import LoginRequiredMixin, JSONResponseMixin
from .models import Event, EvMessage, EvAction, EvActionGraph
from django.core import serializers
from scenario.utility import Membership, make_tree

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
def select_event_location(request, scenario_id, type):
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
                  'success': True,
                  'event_id': list(row)[0]
              })

    j = json.dumps(result)

    return HttpResponse(j, content_type="application/json")


#class based view for json render Event (in the url: /jites/get_event/<idevent>)
class EventDetailView(LoginRequiredMixin, JSONResponseMixin, BaseDetailView):

    model = Event

    def get(self, request, *args, **kwargs):
        qs = Event.objects.get(pk=kwargs['pk'])
        dict = {'data': {'status': qs.status,
                         'subcategory_name': qs.subcategory_name,
                         'event_name': qs.event_name,
                         'is_real': qs.is_real,
                         'category_name': qs.category_name,
                         'event_description': qs.event_description,
                         'time_start': str(qs.time_start),
                        },
                'success': 'true'
                }
        json_response = json.dumps(dict, separators=(',', ':'), sort_keys=True)
        return HttpResponse(json_response, mimetype='text/javascript;')


#standard view for adding message to event
def save_event_message(request, event_id):
    event = Event.objects.get(pk=event_id)
    ts = datetime.now()
    username = request.user
    if request.method == "POST" and request.is_ajax():
        print request.POST
        if request.POST['content']:
            message_to_save = EvMessage(event, ts, username, request.POST['content'])
            message_to_save.save()
            msg = "saved"
        else:
            msg = "post invalid"
    else:
        msg = "GET request are not allowed for this view."
    return HttpResponse(msg)


def tree_to_json(request, event_id):
    event = Event.objects.get(pk=event_id, managing_authority=Membership(request.user).membership_auth)
    root_action = EvAction.objects.get(event=event, name='root')
    actions = EvActionGraph.objects.filter(action__event=event, parent__event=event)

    pc = []
    pc.append([root_action.id, root_action.id, root_action.name])
    for action in actions:
        pc.append([action.parent.id, action.action.id, action.action.name])

    tree = make_tree(pc, root_action.id)
    json_response = json.dumps(dict(tree))
    return HttpResponse(json_response, mimetype='text/javascript;')

