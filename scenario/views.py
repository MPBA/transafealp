# -*- encoding: utf-8 -*-
__author__ = 'ernesto (arbitrio@fbk.eu)'

from django.shortcuts import render_to_response, redirect
from django.core.urlresolvers import reverse
from django.http import HttpResponse, HttpResponseRedirect, Http404
from django.contrib.auth.decorators import login_required
from django.template import RequestContext
from .models import Scenario, ScenarioSubcategory, ActionM2MActor, Action, Actor, ActionGraph, Visualization
from .forms import ScenarioAddForm, ActionAddForm, ActorAddForm, ActionGraphAddForm, VisualizationForm
from utility import Membership, Actor_Action_Association
from django.db import connection, transaction
from django.contrib import messages
from django.utils.encoding import smart_str
from django.db import IntegrityError
from django.contrib.auth.decorators import user_passes_test
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
        "SELECT name, subcategory_id, description , ST_AsGeoJSON(ST_Transform(ST_SetSRID(geom,900913),900913)) FROM scenario WHERE id=%s AND managing_authority_id=%s",
        [scenario_id, Membership(request.user).membership_auth.pk])
    row = cursor.fetchone()

    transaction.commit_unless_managed()
    category = ScenarioSubcategory.objects.get(pk=int(list(row)[1]))
    geometry = list(row)[3]
    print geometry
    context = {'scenario': list(row), 'category': category, 'geometry': geometry}
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
            cursor.execute("INSERT INTO scenario VALUES (DEFAULT, %s, %s, %s, %s, %s)",
                           [Membership(request.user).membership_auth.pk, subcategory.pk, name, description, geometry])
            transaction.commit_unless_managed()

            if 'save_and_add' in request.POST:
                scenario_pk = int(
                    Scenario.objects.filter(managing_authority=Membership(request.user).membership_auth).latest(
                        'id').pk)
                messages.add_message(request, messages.INFO,
                                     'Scenario correctly created! Now you can create an Action!')
                return redirect('scenario.views.action_add', scenario_pk)
            else:
                messages.add_message(request, messages.INFO, 'Scenario correctly created!')
                return redirect('scenario.views.scenario_list')
        else:
            form = ScenarioAddForm(request.POST)

    context = {'form': form}
    return render_to_response('scenario/scenario_add.html', context, context_instance=RequestContext(request))


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
                obj.save()
                return redirect('scenario.views.action_graph_add', scenario.pk, obj.id)
            except Exception, e:
                transaction.rollback()
                db_error = e

        form = ActionAddForm()
    context = {'form': form, 'scenario': scenario, 'last_10_actions': last_10_actions, 'error': db_error}
    return render_to_response('scenario/action_add.html', context, context_instance=RequestContext(request))


@login_required
@user_passes_test(lambda u: u.is_superuser)
def actions_list(request, scenario_id):
    scenario = Scenario.objects.get(pk=scenario_id, managing_authority=Membership(request.user).membership_auth)
    actions = Action.objects.filter(scenario=scenario)
    context = {'actions': actions, 'scenario': scenario}
    return render_to_response('scenario/action_list.html', context, context_instance=RequestContext(request))


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
            messages.add_message(request, messages.INFO, 'Actor correctly saved!')
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
            messages.add_message(request, messages.INFO, 'Actor correctly saved!')
        form = ActorAddForm()
    context = {'form': form}
    return render_to_response('scenario/add_actor_popup.html', context, context_instance=RequestContext(request))


@login_required
@user_passes_test(lambda u: u.is_superuser)
def actors_list(request):
    actors = ActionM2MActor.objects.filter(
        action__scenario__managing_authority=Membership(request.user).membership_auth)
    context = {'actors': actors}
    return render_to_response('scenario/actors_list.html', context, context_instance=RequestContext(request))


@login_required
@user_passes_test(lambda u: u.is_superuser)
def action_graph_add(request, scenario_id, action_id):
    db_error = ""
    scenario = Scenario.objects.get(pk=scenario_id, managing_authority=Membership(request.user).membership_auth)
    actions_allowed = Action.objects.filter(scenario=scenario, pk=action_id)
    form = ActionGraphAddForm(actions_allowed)
    graph = ActionGraph.objects.filter(action__scenario=scenario, parent__scenario=scenario)
    if request.method == 'POST':

        if form.is_valid:
            action = request.POST['action']
            parent = request.POST['parent_select']
            actiongraph = ActionGraph(action=Action.objects.get(pk=action), parent=Action.objects.get(pk=parent))
            try:
                actiongraph.save()
                messages.add_message(request, messages.INFO, 'Action Graph rules correctly saved')
            except Exception, e:
                transaction.rollback()
                db_error = e
                messages.add_message(request, messages.INFO, smart_str(db_error))
    context = {'form': form, 'graph': graph, 'error': db_error, 'scenario': scenario, 'action_id': action_id}
    return render_to_response('scenario/actiongraph_add.html', context, context_instance=RequestContext(request))


@login_required
@user_passes_test(lambda u: u.is_superuser)
def insert_actors_to_action(request, scenario_id, action_id):
    scenario = Scenario.objects.get(pk=scenario_id, managing_authority=Membership(request.user).membership_auth)
    action = Action.objects.get(pk=action_id)

    actors_already_assigned_to_this_action = Actor_Action_Association(request.user, scenario, action).actors_already_assigned_to_this_action()
    #retreive the actor list from actor model for exclude from available actors the actor entry
    l = [l.actor for l in actors_already_assigned_to_this_action]

    actors_av_for_this_action = Actor_Action_Association(request.user, scenario, action).actors_av_for_this_action(l)

    if request.method == 'POST':
        #Save ActorM2MActin instance. We must assign one or more actors to the action selected
        actor_to_save = request.POST.getlist('actor_id') #Retreive from post all the actor id selected by checkboxes
        for actor in actor_to_save:
            actorm2maction = ActionM2MActor(action=action, actor=Actor.objects.get(pk=int(actor)))
            try:
                messages.add_message(request, messages.INFO, 'Association ' + str(actorm2maction) + ' correctly saved!')
                actorm2maction.save()
                actors_already_assigned_to_this_action = Actor_Action_Association(request.user, scenario, action).actors_already_assigned_to_this_action()
                #retreive the actor list from actor model for exclude from available actors the actor entry
                l = [l.actor for l in actors_already_assigned_to_this_action]
                actors_av_for_this_action = Actor_Action_Association(request.user, scenario, action).actors_av_for_this_action(l)
            except Exception, e:
                messages.add_message(request, messages.INFO, smart_str(e))
                pass

    context = {'actors_aa': actors_already_assigned_to_this_action,
               'actors_av': actors_av_for_this_action,
               'action': action,
               'scenario': scenario}
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
        messages.add_message(request, messages.INFO, 'Association' + smart_str(actionm2mactor) + 'correctly deleted!')
        return redirect('scenario.views.insert_actors_to_action', scenario.id, action.id)
    except Exception, e:
        messages.add_message(request, messages.INFO, smart_str(e))
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
            messages.add_message(request, messages.INFO, 'Action Graph rule correctly deleted')
            return redirect('scenario.views.action_graph_add', scenario_id)
        except Exception, e:
            transaction.rollback()
            db_error = e
            messages.add_message(request, messages.INFO, smart_str(db_error))
        return redirect('scenario.views.action_graph_add', scenario_id)


@login_required
@user_passes_test(lambda u: u.is_superuser)
def visualization(request, action_id):
    action = Action.objects.get(pk=action_id)
    form = VisualizationForm()
    visualizations = Visualization.objects.filter(action=action)
    if request.method == 'POST':
        form = VisualizationForm(request.POST, request.FILES)
        if form.is_valid:
            obj = form.save(commit=False)
            obj.action = action
            try:
                obj.save()
                messages.add_message(request, messages.INFO, 'Attach correctly uploaded!')
            except Exception, e:
                transaction.rollback()
                db_error = e
                messages.add_message(request, messages.INFO, smart_str(db_error))
        form = VisualizationForm()
    context = {'action': action, 'form': form, 'visualizations': visualizations}
    return render_to_response('scenario/visualization.html', context, context_instance=RequestContext(request))


@login_required
@user_passes_test(lambda u: u.is_superuser)
def json_action(request, id):
    cursor = connection.cursor()
    cursor.execute("SELECT id, name FROM action WHERE id IN (SELECT * FROM find_available_parents (%s))", [id, ])
    rows = cursor.fetchone()
    transaction.commit_unless_managed()
    data = json.dumps(list(rows)) if rows else ''
    return HttpResponse(json.dumps(data), content_type="application/json")



