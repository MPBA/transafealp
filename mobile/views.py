# Create your views here.
from django.contrib.auth import authenticate, login
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from tojson import render_to_json
import json
from django.http import HttpResponse, HttpResponseForbidden, HttpResponseBadRequest
from jites.models import Event, EvActionGraph


@csrf_exempt
@render_to_json(mimetype='application/json')
def auth(request):

    if request.method == "POST" and request.POST.__contains__('username') and request.POST.__contains__('password'):
        u = str(request.POST['username'])
        p = str(request.POST['password'])
        user = authenticate(username=u, password=p)

        if user is not None:
            # the password verified for the user
            if user.is_active:
                login(request, user)

                result = {
                    "success": True
                }
                return result
            else:
                result = {
                    "success": False,
                    "message": "The password is valid, but the account has been disabled!"
                }
                return result, {'cls': HttpResponseForbidden}
        else:
            # the authentication system was unable to verify the username and password
            result = {
                "success": False,
                "message": "The username / password is invalid!"
            }
            return result, {'cls': HttpResponseForbidden}

    else:
        result = {"success": False,
                  "message": "Bad request"}
        return result, {'cls': HttpResponseBadRequest}



@login_required
@render_to_json(mimetype='application/json')
def eventlist(request):
    event = [event.as_dict() for event in Event.objects.filter(time_end__isnull=True,)]

    res = {
        "success": True,
        "data": event
    }

    return res


@login_required
@render_to_json(mimetype='application/json')
def actionlist(request, pk):
    event = Event.objects.get(pk=pk)
    # root_action = EvAction.objects.get(event=event, name='root')
    actions = EvActionGraph.objects.filter(action__event=event, parent__event=event, is_main_parent=True)
    pc = ([])
    # pc.append([root_action.id,
    #            root_action.id,
    #            root_action.name,
    #            root_action.numcode,
    #            root_action.description,
    #            root_action.duration,
    #            root_action.status,
    #            root_action.comment
    # ])
    for action in actions:
        pc.append({
            "parent_id": action.parent.id,
            "action_id": action.action.id,
            "name": action.action.name,
            "numcode": action.action.numcode,
            "descrition": action.action.description,
            "duration": action.action.duration,
            "status": action.action.status,
            "comment": action.action.comment

        })

    json_response = json.dumps({
        "success": True,
        "data": pc
    })

    return HttpResponse(json_response, mimetype='application/json;')