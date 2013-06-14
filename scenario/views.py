# -*- encoding: utf-8 -*-
__author__ = 'ernesto (arbitrio@fbk.eu)'

from django.shortcuts import render_to_response, redirect
from django.http import HttpResponse, Http404
from django.contrib.auth.decorators import login_required
from django.template import RequestContext
from .models import (Scenario, ScenarioSubcategory, ActionM2MActor, Action, Actor,
                     ActionGraph, Visualization, ManagingAuthority)
from .forms import (ScenarioAddForm, ActionAddForm, ActorAddForm, ActionGraphAddForm, VisualizationForm,
                    SelectActionForm, StartActionForm, SelectScenarioForm)
from utility import Membership, Actor_Action_Association, handle_uploaded_file
from django.db import connection, transaction
from django.contrib import messages
from django.utils.encoding import smart_str
from django.contrib.auth.decorators import user_passes_test
from django.utils.safestring import mark_safe
import json


@login_required
@user_passes_test(lambda u: u.is_superuser)
def scenario_list(request):
    managing_auth = Membership(request.user).membership_auth
    scenarios = Scenario.objects.filter(managing_authority=managing_auth).order_by('-id', 'name')
    context = {'scenarios': scenarios}
    return render_to_response('scenario/scenario_list.html', context, context_instance=RequestContext(request))


@login_required
@user_passes_test(lambda u: u.is_superuser)
def scenario_detail(request, scenario_id):
    cursor = connection.cursor()
    cursor.execute(
        "SELECT name, subcategory_id, description , ST_AsGeoJSON(ST_Transform(geom,900913)) FROM scenario WHERE id=%s AND managing_authority_id=%s",
        [scenario_id, Membership(request.user).membership_auth.pk])
    row = cursor.fetchone()

    transaction.commit_unless_managed()
    category = ScenarioSubcategory.objects.get(pk=int(list(row)[1]))
    geometry = list(row)[3]
    actions = Action.objects.filter(scenario__id=scenario_id)
    graph_img = '/plr/execute/graph_action/'+str(scenario_id)+'/800/600'
    actors = ActionM2MActor.objects.values('actor__pk').annotate().filter(action__scenario__id=scenario_id).\
                                                              filter(action__scenario__managing_authority=Membership(request.user).
                                                              membership_auth).\
                                                              order_by('actor__name')
    actors = Actor.objects.filter(pk__in=[a['actor__pk'] for a in actors])
    visualizations = Visualization.objects.filter(action__scenario__id=scenario_id)
    context = {
               'scenario': list(row),
               'category': category,
               'geometry': geometry,
               'actions': actions,
               'graph': graph_img,
               'actors': actors,
               'visualizations': visualizations,
               'scenario_id': scenario_id
              }
    return render_to_response('scenario/scenario_detail.html', context, context_instance=RequestContext(request))


@login_required
@user_passes_test(lambda u: u.is_superuser)
def scenario_add(request):
    form = ScenarioAddForm()
    if request.POST:

        if form.is_valid:
            geometry = str(request.POST['geometry'])
            name = smart_str(request.POST['name'])
            description = smart_str(request.POST['description'])
            subcategory = ScenarioSubcategory.objects.get(pk=request.POST['subcategory'])
            cursor = connection.cursor()
            cursor.execute("INSERT INTO scenario VALUES (DEFAULT, %s, %s, %s, %s, ST_Multi(ST_Transform(ST_SetSRID(%s::geometry,900913),3035)))",
                           [Membership(request.user).membership_auth.pk, subcategory.pk, name, description, geometry])
            transaction.commit_unless_managed()

            if 'save_and_add' in request.POST:
                scenario_pk = int(
                    Scenario.objects.filter(managing_authority=Membership(request.user).membership_auth).latest(
                        'id').pk)
                messages.add_message(request, messages.SUCCESS,
                                     'Scenario correctly created! Now you can create an Action!')
                return redirect('scenario.views.action_add', scenario_pk)
            else:
                messages.add_message(request, messages.SUCCESS, 'Scenario correctly created!')
                return redirect('scenario.views.scenario_list')
        else:
            form = ScenarioAddForm(request.POST)

    context = {'form': form}
    return render_to_response('scenario/scenario_add.html', context, context_instance=RequestContext(request))


@login_required
@user_passes_test(lambda u: u.is_superuser)
def del_scenario(request, scenario_id):
    scenario = Scenario.objects.get(pk=scenario_id)
    try:
        scenario.delete()
        messages.add_message(request, messages.SUCCESS, 'Scenario ' + smart_str(scenario) + ' correctly deleted!')
        return redirect('scenario.views.scenario_list')
    except Exception, e:
        messages.add_message(request, messages.ERROR, smart_str(e))
        return redirect('scenario.views.scenario_list')
        pass
    pass


@login_required
@user_passes_test(lambda u: u.is_superuser)
def action_add(request, scenario_id):
    db_error = ""
    scenario = Scenario.objects.get(pk=scenario_id, managing_authority=Membership(request.user).membership_auth)
    last_10_actions = Action.objects.filter(scenario=scenario).order_by('-id')[:10]
    form = ActionAddForm()
    if request.method == 'POST':
        form = ActionAddForm(request.POST)
        if form.is_valid:
            obj = form.save(commit=False)
            obj.scenario = scenario
            try:
                messages.add_message(request, messages.SUCCESS, 'Action correctly saved!')
                obj.save()
                #return redirect('scenario.views.action_graph_add', scenario.pk)
            except Exception, e:
                transaction.rollback()
                db_error = e
                messages.add_message(request, messages.SUCCESS, smart_str(db_error))

        form = ActionAddForm()
    context = {'form': form, 'scenario': scenario, 'last_10_actions': last_10_actions, 'error': db_error}
    return render_to_response('scenario/action_add.html', context, context_instance=RequestContext(request))


@login_required
@user_passes_test(lambda u: u.is_superuser)
def action_edit(request, action_id):
    db_error = ""
    action = Action.objects.get(pk=action_id)
    scenario = Scenario.objects.get(pk=action.scenario.pk)
    form = ActionAddForm(instance=action)
    if request.method == 'POST':
        form = ActionAddForm(request.POST, instance=action)
        if form.is_valid:
            obj = form.save(commit=False)
            obj.scenario = scenario
            try:
                obj.save()
                messages.add_message(request, messages.SUCCESS, 'Action correctly saved!')
                return redirect('scenario.views.actions_list', scenario.pk)
            except Exception, e:
                transaction.rollback()
                db_error = e
                messages.add_message(request, messages.SUCCESS, smart_str(db_error))

        form = ActionAddForm(request.POST)
    context = {'form': form, 'error': db_error, 'action': action}
    return render_to_response('scenario/action_edit.html', context, context_instance=RequestContext(request))


@login_required
@user_passes_test(lambda u: u.is_superuser)
def del_action(request, action_id):
    action = Action.objects.get(pk=action_id)
    scenario = action.scenario.pk
    try:
        action.delete()
        messages.add_message(request, messages.SUCCESS, 'Action' + smart_str(action) + 'correctly deleted!')
        return redirect('scenario.views.actions_list', scenario)
    except Exception, e:
        messages.add_message(request, messages.ERROR, smart_str(e))
        return redirect('scenario.views.actions_list', scenario)
        pass
    pass


@login_required
@user_passes_test(lambda u: u.is_superuser)
def actions_list(request, scenario_id):
    scenario = Scenario.objects.get(pk=scenario_id, managing_authority=Membership(request.user).membership_auth)
    actions = Action.objects.filter(scenario=scenario).order_by('numcode')
    context = {'actions': actions, 'scenario': scenario}
    return render_to_response('scenario/action_list.html', context, context_instance=RequestContext(request))


@login_required
@user_passes_test(lambda u: u.is_superuser)
def select_scenario(request):
    scenarios = Scenario.objects.filter(managing_authority=Membership(request.user).membership_auth)
    form = SelectScenarioForm(scenarios)
    context = {'form': form}
    if request.method == 'POST':
        return redirect('scenario.views.actors_add', request.POST['scenario'])
    else:
        return render_to_response('scenario/select_scenario.html', context, context_instance=RequestContext(request))


@login_required
@user_passes_test(lambda u: u.is_superuser)
def actors_add(request, scenario_id):
    scenario = Scenario.objects.get(pk=scenario_id, managing_authority=Membership(request.user).membership_auth)
    action = Action.objects.filter(scenario=scenario, name='root').latest('id')
    form = ActorAddForm()
    if request.method == 'POST':
        form = ActorAddForm(request.POST)
        if form.is_valid:
            obj = form.save(commit=False)
            obj.save()
            actor = Actor.objects.get(pk=obj.id)
            actorm2maction = ActionM2MActor(action=action, actor=actor)
            actorm2maction.save()
            messages.add_message(request, messages.SUCCESS, 'Actor correctly saved!')
            return redirect('scenario.views.actors_list')
        form = ActorAddForm()
    context = {'form': form}
    return render_to_response('scenario/actor_add.html', context, context_instance=RequestContext(request))


@login_required
@user_passes_test(lambda u: u.is_superuser)
def actors_add_popup(request, scenario_id):
    scenario = Scenario.objects.get(pk=scenario_id, managing_authority=Membership(request.user).membership_auth)
    action = Action.objects.filter(scenario=scenario, name='root').latest('id')
    form = ActorAddForm()
    if request.method == 'POST':
        form = ActorAddForm(request.POST)
        if form.is_valid:
            obj = form.save(commit=False)
            obj.save()
            actor = Actor.objects.get(pk=obj.id)
            actorm2maction = ActionM2MActor(action=action, actor=actor)
            actorm2maction.save()
            messages.add_message(request, messages.SUCCESS, 'Actor correctly saved!')
        form = ActorAddForm()
    context = {'form': form}
    return render_to_response('scenario/add_actor_popup.html', context, context_instance=RequestContext(request))


@login_required
@user_passes_test(lambda u: u.is_superuser)
def actors_list(request):
    actors = ActionM2MActor.objects.values('actor__pk').annotate().\
                                                              filter(action__scenario__managing_authority=Membership(request.user).
                                                              membership_auth).\
                                                              order_by('actor__name')
    actors = Actor.objects.filter(pk__in=[a['actor__pk'] for a in actors])
    context = {'actors': actors}
    return render_to_response('scenario/actors_list.html', context, context_instance=RequestContext(request))


@login_required
@user_passes_test(lambda u: u.is_superuser)
def actors_edit(request, actor_id):
    actor = Actor.objects.get(id=actor_id)
    form = ActorAddForm(instance=actor)
    if request.method == 'POST':
        form = ActorAddForm(request.POST, instance=actor)
        if form.is_valid:
            obj = form.save(commit=False)
            obj.save()
            messages.add_message(request, messages.SUCCESS, 'Actor correctly saved!')
            return redirect('scenario.views.actors_list')
        form = ActorAddForm(request.POST,  instance=actor)
        messages.add_message(request, messages.ERROR, 'An error occurred! Please retry.')
    context = {'form': form, 'actor': actor}
    return render_to_response('scenario/actor_edit.html', context, context_instance=RequestContext(request))


@login_required
@user_passes_test(lambda u: u.is_superuser)
def del_actor(request, actor_id):
    actor = Actor.objects.get(pk=actor_id)
    try:
        actor.delete()
        messages.add_message(request, messages.SUCCESS, 'Actor correctly deleted!')
        return redirect('scenario.views.actors_list')
    except Exception, e:
        messages.add_message(request, messages.ERROR, smart_str(e))
        return redirect('scenario.views.actors_list')
        pass
    pass


@login_required
@user_passes_test(lambda u: u.is_superuser)
def action_graph_add(request, scenario_id):
    db_error = ""
    scenario = Scenario.objects.get(pk=scenario_id, managing_authority=Membership(request.user).membership_auth)
    actions_allowed = Action.objects.filter(scenario=scenario)
    form = ActionGraphAddForm(actions_allowed)
    graph = ActionGraph.objects.filter(action__scenario=scenario, parent__scenario=scenario)
    graph_url = '<a href="plr/execute/graph_action/'+str(scenario_id)+'/1000/1000" class="iframe"><img src="plr/execute/graph_action/'+str(scenario_id)+'/400/400"></a>'
    if request.method == 'POST':

        if form.is_valid:
            action = request.POST['action']
            parent = request.POST['parent_select']
            actiongraph = ActionGraph(action=Action.objects.get(pk=action), parent=Action.objects.get(pk=parent))
            try:
                actiongraph.save()
                messages.add_message(request, messages.SUCCESS, 'Action Graph rules correctly saved')
            except Exception, e:
                transaction.rollback()
                db_error = e
                messages.add_message(request, messages.ERROR, smart_str(db_error))
    context = {'form': form, 'graph': graph, 'error': db_error, 'scenario': scenario, 'graph_url': mark_safe(graph_url)}
    return render_to_response('scenario/actiongraph_add.html', context, context_instance=RequestContext(request))


@login_required
@user_passes_test(lambda u: u.is_superuser)
def insert_actors_to_action(request, scenario_id, action_id=None):
    try:
        scenario = Scenario.objects.get(pk=scenario_id, managing_authority=Membership(request.user).membership_auth)
    except Scenario.DoesNotExist:
        raise Http404
    if action_id == None:
        actions = Action.objects.filter(scenario=scenario)
        oneaction = 0
    else:
        actions = Action.objects.filter(scenario=scenario, pk=action_id)
        oneaction = 1

    form = SelectActionForm(actions)
    if request.method == 'POST':
        form = SelectActionForm(actions, request.POST)
        actors_already_assigned_to_this_action = Actor_Action_Association(request.user, scenario, int(request.POST['actions'])).actors_already_assigned_to_this_action()
        #retreive the actor list from actor model for exclude from available actors the actor entry
        l = [l.actor for l in actors_already_assigned_to_this_action]
        actors_av_for_this_action = Actor_Action_Association(request.user, scenario, int(request.POST['actions'])).actors_av_for_this_action(l)
        action = Action.objects.get(pk=int(request.POST['actions']))
        actions = Action.objects.filter(scenario=scenario)
        if 'add' in request.POST:
            #Save ActorM2MAction instance. We must assign one or more actors to the action selected
            actor_to_save = request.POST.getlist('actor_id') #Retreive from post all the actor id selected by checkboxes
            for actor in actor_to_save:
                actorm2maction = ActionM2MActor(action=action, actor=Actor.objects.get(pk=int(actor)))
                try:
                    messages.add_message(request, messages.SUCCESS, 'Association ' + str(actorm2maction) + ' correctly saved!')
                    actorm2maction.save()
                    actors_already_assigned_to_this_action = Actor_Action_Association(request.user, scenario, action).actors_already_assigned_to_this_action()
                    #retreive the actor list from actor model for exclude from available actors the actor entry
                    l = [l.actor for l in actors_already_assigned_to_this_action]
                    actors_av_for_this_action = Actor_Action_Association(request.user, scenario, action).actors_av_for_this_action(l)
                except Exception, e:
                    messages.add_message(request, messages.ERROR, smart_str(e))
                    pass

        context = {'actors_aa': actors_already_assigned_to_this_action,
                   'actors_av': actors_av_for_this_action,
                   'action': action,
                   'actions': actions,
                   'scenario': scenario,
                   'form': form,
                   'oneaction': oneaction,
                   'stop': 1}
        return render_to_response('scenario/insert_actors_to_action.html', context,
                              context_instance=RequestContext(request))
    context = {'scenario': scenario, 'actions': actions, 'form': form, 'oneaction': oneaction, 'stop': 0}
    return render_to_response('scenario/insert_actors_to_action.html', context,
                              context_instance=RequestContext(request))

@login_required
@user_passes_test(lambda u: u.is_superuser)
def delete_actor_action(request, association_id):
    actionm2mactor = ActionM2MActor.objects.get(pk=association_id)
    scenario = actionm2mactor.action.scenario
    action = actionm2mactor.action
    try:
        actionm2mactor.delete()
        messages.add_message(request, messages.SUCCESS, 'Association' + smart_str(actionm2mactor) + 'correctly deleted!')
        return redirect('scenario.views.insert_actors_to_action', scenario.id, action.id)
    except Exception, e:
        messages.add_message(request, messages.ERROR, smart_str(e))
        return redirect('scenario.views.insert_actors_to_action', scenario.id, action.id)
        pass
    pass


@login_required
@user_passes_test(lambda u: u.is_superuser)
def delete_action_from_graph(request, scenario_id, graph_id):
    scenario = Scenario.objects.get(pk=scenario_id, managing_authority=Membership(request.user).membership_auth)
    action_graph = ActionGraph.objects.get(pk=graph_id)
    if action_graph.action.scenario == scenario and action_graph.parent.scenario == scenario:
        try:
            action_to_delete = ActionGraph.objects.get(pk=graph_id).delete()
            messages.add_message(request, messages.SUCCESS, 'Action Graph rule correctly deleted')
            return redirect('scenario.views.action_graph_add', scenario_id)
        except Exception, e:
            transaction.rollback()
            db_error = e
            messages.add_message(request, messages.ERROR, smart_str(db_error))
        return redirect('scenario.views.action_graph_add', scenario_id)


@login_required
@user_passes_test(lambda u: u.is_superuser)
def visualization(request, scenario_id, action_id=None):
    resource = ''
    scenario = Scenario.objects.get(pk=scenario_id, managing_authority=Membership(request.user).membership_auth)
    if action_id == None:
        actions = Action.objects.filter(scenario=scenario)
        oneaction = 0
    else:
        actions = Action.objects.filter(scenario=scenario, pk=action_id)
        oneaction = 1

    action_form = SelectActionForm(actions)
    if request.method == 'POST':
        visualizations = Visualization.objects.filter(action=int(request.POST['actions']))
        action_form = SelectActionForm(actions, request.POST)
        form = VisualizationForm(request.POST, request.FILES)
        action = Action.objects.get(pk=int(request.POST['actions']))
        if ('save_vis' in request.POST) and form.is_valid:
            #obj = form.save(commit=False)
            #obj.action = action
            if request.POST['toggler'] == '1':
                resource = handle_uploaded_file(request.FILES['resource'])
                #upload file
                type = 'file'
                options = 'local'
            elif request.POST['toggler'] == '2':
                resource = request.POST['resource2']
                type = 'file'
                options = 'remote'
            elif request.POST['toggler'] == '3':
                resource = request.POST['resource3']
                type = 'wms'
                options = 'wms layer'
            try:
                visualization = Visualization(action=action, description=str(request.POST['description']), type=type, resource=resource, options=options)
                visualization.save()
                messages.add_message(request, messages.SUCCESS, 'Attach correctly uploaded!')
            except Exception, e:
                transaction.rollback()
                db_error = e
                messages.add_message(request, messages.ERROR, smart_str(db_error))

        form = VisualizationForm()
        context = {'actions': actions,
                   'form': form,
                   'visualizations': visualizations,
                   'action_form': action_form,
                   'action': action,
                   'scenario_id': scenario_id,
                   'oneaction': oneaction,
                   'stop': 1}
        return render_to_response('scenario/visualization.html', context, context_instance=RequestContext(request))
    context = {'scenario_id': scenario_id, 'actions': actions, 'action_form': action_form, 'oneaction': oneaction, 'stop': 0}
    return render_to_response('scenario/visualization.html', context, context_instance=RequestContext(request))


@login_required
@user_passes_test(lambda u: u.is_superuser)
def del_visualization(request, visualization_id, scenario_id, action_id):

    visualization = Visualization.objects.get(pk=visualization_id)
    try:
        visualization.delete()
        messages.add_message(request, messages.SUCCESS, 'Visualization' + smart_str(visualization) + 'correctly deleted!')
        return redirect('scenario.views.visualization', scenario_id, action_id)
    except Exception, e:
        messages.add_message(request, messages.ERROR, smart_str(e))
        return redirect('scenario.views.visualization', scenario_id, action_id)
        pass
    pass


@login_required
@user_passes_test(lambda u: u.is_superuser)
def json_action(request, id):
    cursor = connection.cursor()
    cursor.execute("SELECT id, name FROM action WHERE id IN (SELECT * FROM find_available_parents (%s))", [id, ])
    rows = cursor.fetchall()
    transaction.commit_unless_managed()
    #data = json.dumps(dict(rows)) if rows else ''
    rowarray_list = []
    for row in rows:
        t = (row[0], row[1])
        rowarray_list.append(t)
    j = json.dumps(rowarray_list)
    return HttpResponse(j, content_type="application/json")


@login_required
def search_event(request, type):
    if type == 'emergency':
        managing_authority = Membership(request.user).membership_list
        ma_scenarios = Scenario.objects.filter(managing_authority=managing_authority)
        category = ScenarioSubcategory.objects.filter(pk__in=[cat.subcategory_id for cat in ma_scenarios])
    elif type == 'simulation':
        managing_authority = ManagingAuthority.objects.all()
        category = ScenarioSubcategory.objects.all()
    form = StartActionForm(category, managing_authority)
    if request.method == 'POST':
        form = StartActionForm(category, managing_authority, request.POST)
        try:
            scenarios = Scenario.objects.filter(managing_authority=ManagingAuthority.objects.get(pk=request.POST['managing_authority']),
                                                subcategory=ScenarioSubcategory.objects.get(pk=request.POST['category']))
        except Scenario.DoesNotExist:
            scenarios = None
        context = {'ma': managing_authority, 'category': category, 'form': form, 'type': type, 'scenarios': scenarios}
        return render_to_response('scenario/search_event.html', context, context_instance=RequestContext(request))
    else:
        context = {'ma': managing_authority, 'category': category, 'form': form, 'type': type}
        return render_to_response('scenario/search_event.html', context, context_instance=RequestContext(request))