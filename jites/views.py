# Create your views here.
from django.utils import timezone
from django.db import transaction, connection, DatabaseError
from django.http import HttpResponse, HttpResponseBadRequest
from django.shortcuts import render_to_response, redirect
from django.contrib.auth.decorators import login_required
from django.template import RequestContext
import json
from django.views.decorators.csrf import csrf_exempt
import pytz
from scenario.models import Scenario, ScenarioSubcategory
from django.views.generic.detail import BaseDetailView
from mixin import LoginRequiredMixin, JSONResponseMixin
from .models import Event, EvMessage, EvAction, EvActionGraph, EvVisualization, EvActor, EventLog
from django.db.models import Max
from .utility import make_tree, Actor_Action_Association, SetEncoder, actiondetail_json
from datetime import datetime
from scenario.utility import Membership


@login_required
def dashboard(request, displaymode, event_id):
    event = Event.objects.get(pk=event_id)
    if event.managing_authority == Membership(request.user).membership_auth and event.is_real is True:
        can_edit = True
    elif event.managing_authority != Membership(request.user).membership_auth and event.is_real is False:
        can_edit = True
    elif event.managing_authority == Membership(request.user).membership_auth and event.is_real is False:
        can_edit = True
    else:
        can_edit = False

    if event.status == 'open':
        is_open = True
    else:
        is_open = False

    context = {
        'displaymode': displaymode,
        'event_id': event_id,
        'username': request.user,
        'can_edit': can_edit,
        'is_open': is_open,
        'event': event
    }

    return render_to_response('jites/dashboard.html', context, context_instance=RequestContext(request))


@login_required
def poll(request, event_id):
    # TODO implemented by real request on scenario log table. This is a demo.
    result = []
    #datatime format accepted '2013-06-05 15:39:30.507493+02'
    if request.method == 'POST' and request.is_ajax():
        ts_post = datetime.strptime(str(request.POST['ts_post']), '%Y-%m-%d %H:%M:%S.%f+02')
        ts_post = ts_post.replace(tzinfo=pytz.timezone('UTC'))

        log_rows = EventLog.objects.filter(event_id=event_id, ts__gt=ts_post)
        log_new_ts = EventLog.objects.filter(event_id=event_id, ts__gt=ts_post).aggregate(Max('ts'))

        if log_new_ts['ts__max'] is not None:
            result.append({
                'type': 'event',
                'name': 'updatets',
                'data': {
                    'ts': log_new_ts['ts__max'].strftime("%Y-%m-%d %H:%M:%S.%f+02")
                }
            })

        for row in log_rows:
            if row.table_name == 'ev_message':
                #msg =  if row.table_name == 'ev_message' else row.fields['name']
                result.append({
                    'type': 'event',
                    'name': 'log',
                    'data': {
                        'id': request.user.id,
                        'table_name': 'Message',
                        'ts': str(row.ts.strftime("%d/%m/%y %H:%M:%S.%f")),
                        'username': row.fields['username'],
                        'msg': row.fields['content']
                    }
                })
            if row.table_name == 'event':
                msg = None
                if row.action == 'I':
                    msg = 'The event <b>"{0}"</b> is started'.format(row.fields['event_name'])
                else:
                    msg = 'Event <b>"{0}" completed</b> '.format(row.fields['event_name'])

                result.append({
                    'type': 'event',
                    'name': 'log',
                    'data': {
                        'id': request.user.id,
                        'table_name': 'Event',
                        'ts': str(row.ts.strftime("%d/%m/%y %H:%M:%S.%f")),
                        'username': row.event.managing_authority.name,
                        'msg': msg
                    }
                })
            elif row.table_name == 'ev_action':
                msg = None
                if row.action == 'I':
                    msg = 'The action <b>"{0}"</b> was added to the event with status <b>{1}</b>'.format(row.fields['name'],
                                                                                         row.fields['status'])
                else:
                    msg = 'The status of <b>"{0}"</b> has been upgraded to <b>{1}</b>'.format(row.fields['name'],
                                                                              row.fields['status'])
                    result.append({
                        'type': 'event',
                        'name': 'update_action_status',
                        'data': {
                            'id': format(row.fields['id']),
                            'status': format(row.fields['status'])
                        }
                    })

                result.append({
                    'type': 'event',
                    'name': 'log',
                    'data': {
                        'id': request.user.id,
                        'table_name': 'Action',
                        'ts': str(row.ts.strftime("%d/%m/%y %H:%M:%S.%f")),
                        'username':  row.event.managing_authority.name,
                        'msg': msg
                    }
                })


    j = json.dumps(result)
    return HttpResponse(j, content_type="application/json")


@login_required
def select_event_location(request, scenario_id, type):
    try:
        cursor = connection.cursor()
        cursor.execute(
            "SELECT name, subcategory_id, description, ST_AsGeoJSON(ST_Transform(geom,900913)) FROM scenario WHERE id=%s",
            [scenario_id])

    except DatabaseError, e:
        transaction.rollback()
        msg = {
            "success": False,
            "message": str(e)
        }
        return HttpResponseBadRequest(json.dumps(msg))

    row = cursor.fetchone()
    cursor.close()

    category = ScenarioSubcategory.objects.get(pk=int(list(row)[1]))
    geometry = list(row)[3]
    context = {'scenario': list(row), 'scenario_id': scenario_id, 'category': category, 'geometry': geometry,
               'type': type}
    return render_to_response('jites/select_event_location.html', context, context_instance=RequestContext(request))


@login_required
def start_event(request, scenario_id, type):
    point = request.GET['point']
    scenario = Scenario.objects.get(pk=scenario_id)

    is_real = None
    if type == 'simulation':
        is_real = False
    elif type == 'emergency':
        is_real = True

    geom = 'SRID=900913;POINT({0})'.format(point)

    try:
        cursor = connection.cursor()
        cursor.execute(
            "select * from start_event(%s,%s,ST_Transform(%s::geometry,3035));",
            [scenario.name, is_real, geom])
    except DatabaseError, e:
        transaction.rollback()
        msg = {
            "success": False,
            "message": str(e)
        }
        return HttpResponseBadRequest(json.dumps(msg))

    row = cursor.fetchone()
    cursor.close()

    result = {
        'success': True,
        'event_id': list(row)[0]
    }

    j = json.dumps(result)

    return HttpResponse(j, content_type="application/json")


#class based view for json render Event (in the url: /jites/get_event/<idevent>)
class EventDetailView(LoginRequiredMixin, JSONResponseMixin, BaseDetailView):
    model = Event

    def get(self, request, *args, **kwargs):
        qs = Event.objects.get(pk=kwargs['pk'])

        try:
            cursor = connection.cursor()
            cursor.execute(
                'select '
                'ST_X(ST_Transform(event_geom,900913)) as event_x,'
                'ST_Y(ST_Transform(event_geom,900913)) as event_y '
                'from event where id = %s',
                [kwargs['pk']])
        except DatabaseError, e:
            transaction.rollback()
            msg = {
                "success": False,
                "message": str(e)
            }
            return HttpResponseBadRequest(json.dumps(msg))

        row = cursor.fetchone()
        cursor.close()

        dict = {'data': {'status': qs.status,
                         'subcategory_name': qs.subcategory_name,
                         'event_name': qs.event_name,
                         'is_real': qs.is_real,
                         'category_name': qs.category_name,
                         'event_description': qs.event_description,
                         'time_start': str(qs.time_start),
                         'lon': row[0],
                         'lat': row[1]
        },
                'success': 'true'
        }

        json_response = json.dumps(dict, separators=(',', ':'), sort_keys=True)
        return HttpResponse(json_response, mimetype='application/json;')


#class based view for json render Action (in the url: /jites/get_action/<idevent>)
class ActionDetailView(LoginRequiredMixin, JSONResponseMixin, BaseDetailView):
    model = EvAction

    def get(self, request, *args, **kwargs):
        action_detail = actiondetail_json(request.user, kwargs['pk'])

        json_response = json.dumps(action_detail, separators=(',', ':'), sort_keys=True, cls=SetEncoder)

        return HttpResponse(json_response, mimetype='application/json;')


#standard view for adding message to event
@login_required()
def update_action_status(request, pk):
    #action = EvAction.objects.get(pk=pk)
    if request.method == "POST" and request.is_ajax():
        status = request.POST['status']
        comment = request.POST['content']
        try:
            cursor = connection.cursor()
            cursor.execute('update ev_action set status = %s, comment = %s where id = %s returning txid_current();',
                           [status, comment, pk])
        except DatabaseError, e:
            transaction.rollback()
            msg = {
                "success": False,
                "message": str(e)
            }
            return HttpResponseBadRequest(json.dumps(msg))

        row = cursor.fetchone()
        txid = row[0]
        cursor.close()
        #logs_rows is a queryset with all updated related action.
        logs_rows = EventLog.objects.filter(txid=txid, action='U', table_name='ev_action')
        updated_actions_dict = []
        for log in logs_rows:
            updated_actions_dict.append({
                'row_id': log.row_id,
                'status': log.new_fields['status'],
                'name': log.fields['name']
            })

        action_detail = actiondetail_json(request.user, pk)

        msg = {
            "success": True,
            "action_detail": action_detail,
            "updated_actions": updated_actions_dict,
        }

    else:
        msg = {
            "success": False,
            "message": "GET request are not allowed for this view."
        }

    json_response = json.dumps(msg, separators=(',', ':'), sort_keys=True, cls=SetEncoder)
    return HttpResponse(json_response, mimetype="application/json;")


#standard view for adding message to event
@login_required()
def save_event_message(request, event_id):
    event = Event.objects.get(pk=event_id)
    ts = timezone.now()
    username = request.user
    if request.method == "POST" and request.is_ajax():
        if request.POST['content']:
            message_to_save = EvMessage(event=event, ts=ts, username=username, content=request.POST['content'])
            message_to_save.save()
            msg = {
                "success": True
            }
        else:
            msg = {
                "success": False,
                "message": "Form is invalid"
            }
    else:
        msg = {
            "success": False,
            "message": "GET request are not allowed for this view."
        }

    json_response = json.dumps(msg)
    return HttpResponse(json_response, mimetype="application/json;")


@login_required
def tree_to_json(request, event_id):
    event = Event.objects.get(pk=event_id)
    root_action = EvAction.objects.get(event=event, name='root')
    actions = EvActionGraph.objects.filter(action__event=event, parent__event=event, is_main_parent=True)
    pc = ([])
    pc.append([root_action.id,
               root_action.id,
               root_action.name,
               root_action.numcode,
               root_action.description,
               root_action.duration,
               root_action.status,
               root_action.comment
    ])
    for action in actions:
        pc.append([action.parent.id,
                   action.action.id,
                   action.action.name,
                   action.action.numcode,
                   action.action.description,
                   action.action.duration,
                   action.action.status,
                   action.action.comment
        ])

    tree = make_tree(pc, root_action.id)
    json_response = json.dumps(dict(tree))

    return HttpResponse(json_response, mimetype='text/javascript;')


@csrf_exempt
@login_required
def proxy(request):
    import httplib2

    conn = httplib2.Http(disable_ssl_certificate_validation=True)

    url = request.GET['url']
    if request.method == 'GET':
        response, content = conn.request(url, request.method)

    return HttpResponse(content, status=int(response['status']), mimetype=response['content-type'])


@login_required
def run_rerouting(request, type):
    try:
        if type == 'fastest':
            cursor = connection.cursor()
            cursor.execute(
                "SELECT path_fastest(%s,%s,%s)",
                [request.POST['polygon'], int(request.POST['source']), int(request.POST['target'])]
            )
        elif type == 'shortest':
            cursor = connection.cursor()
            cursor.execute(
                "SELECT path_shortest(%s,%s,%s)",
                [request.POST['polygon'], int(request.POST['source']), int(request.POST['target'])]
            )
        elif type == 'vulnerability':
            cursor = connection.cursor()
            cursor.execute(
                "SELECT path_vulnerability(%s,%s,%s,%s)",
                [request.POST['vuln'], request.POST['polygon'], int(request.POST['source']), int(request.POST['target'])]
            )
    except DatabaseError, e:
        transaction.rollback()
        return HttpResponse(str(e))

    row = cursor.fetchone()
    cursor.close()

    result = {
        "success": True,
        "type:": type,
        "path": row[0]
    }
    json_response = json.dumps(result)

    return HttpResponse(json_response, mimetype='text/javascript;')


@login_required
def eventlist(request):
    events = Event.objects.filter(status='open', is_real=True)
    context = {
        "events": events
    }

    return render_to_response('jites/eventlist.html', context, context_instance=RequestContext(request))


@login_required
def closedevents(request):
    events = Event.objects.filter(status='closed', is_real=True)
    context = {
        "events": events
    }

    return render_to_response('jites/closedevents.html', context, context_instance=RequestContext(request))


#standard view for adding message to event
@login_required()
def close_event(request, scenario_id):
    event = Event.objects.get(pk=scenario_id)
    ts = timezone.now()

    try:
        event.status = "closed"
        event.time_end = ts
        event.save()

        result = {
            "success": True
        }
        json_response = json.dumps(result)

        return HttpResponse(json_response, mimetype="application/json;")
    except DatabaseError, e:
        result = {
            "success": True,
            "message": str(e)
        }
        json_response = json.dumps(result)

        return HttpResponseBadRequest(json_response)


@login_required
def event_statistics(request, event_id):
    event = Event.objects.get(pk=event_id)
    actions_total = EvAction.objects.filter(event=event).count()
    actions_terminated_without_success = EvAction.objects.filter(event=event, status__icontains="terminated")\
                                                         .exclude(status__icontains="(success)").count()
    actions_terminated_with_success = EvAction.objects.filter(event=event, status__icontains="(success)").count()
    actions_executalbe = EvAction.objects.filter(event=event, status="executable").count()
    actions_non_executable = EvAction.objects.filter(event=event, status="non executable").count()
    exec_time = event.time_end - event.time_start
    actions_log = EventLog.objects.filter(event=event, table_name='ev_action', action='U').order_by('ts')
    result = []
    for row in actions_log:
        msg = 'The status to <b>{0}</b>'.format(row.fields['status'])
        result.append({
            'name': row.fields['name'],
            'ts': str(row.ts.strftime("%d/%m/%y %H:%M:%S.%f")),
            'username': '',
            'msg': msg
        })
    context = {
        'total': actions_total,
        'term_w_success': actions_terminated_with_success,
        'term_wo_success': actions_terminated_without_success,
        'exec_time': exec_time,
        'event': event,
        'result': result,
        'exec': actions_executalbe,
        'nonexec': actions_non_executable
    }
    return render_to_response('jites/event_stats.html', context, context_instance=RequestContext(request))