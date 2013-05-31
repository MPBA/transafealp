# -*- encoding: utf-8 -*-
__author__ = 'ernesto (arbitrio@fbk.eu)'
from .models import ManagingAuthority
from django.contrib.auth.models import User
from scenario.models import ActionM2MActor, Actor
import tempfile
import shutil
from django.conf import settings
import os

'''
This class allow to define the Managing Auth property or function. Passing the user you can retrieve information about
the managing auth model. The membership_auth property return which MA belongs to the passed user or None if user has no
owner
'''


class Membership(object):
    def __init__(self, user):
        self.user = user
        self.user_id = user.pk

    @property
    def membership_auth(self):
        try:
            ma = ManagingAuthority.objects.get(auth_user=User.objects.get(pk=self.user_id))
        except ManagingAuthority.DoesNotExist:
            ma = None
        return ma

    @property
    def membership_list(self):
        try:
            ma = ManagingAuthority.objects.filter(auth_user=User.objects.get(pk=self.user_id))
        except ManagingAuthority.DoesNotExist:
            ma = None
        return ma

'''
This class allow to retreive the actor already added to an action and the actors available for an action and scenario.
Passing the user, the scenario and the action you can retrieve information about
the actor model. The two function return a queryset
'''


class Actor_Action_Association(object):
    def __init__(self, user, scenario, action):
        self.user = user
        self.scenario = scenario
        self.action = action

    def actors_already_assigned_to_this_action(self):
        try:
            actors = ActionM2MActor.objects.filter(action__scenario__managing_authority=Membership(self.user).
                                                   membership_auth, action__scenario=self.scenario).\
                                                   filter(action=self.action).order_by('actor__name')
        except ActionM2MActor.DoesNotExists:
            actors = None
        return actors

    def actors_av_for_this_action(self, l):
        try:
            actors = ActionM2MActor.objects.values('actor__pk').annotate().\
                                                              filter(action__scenario__managing_authority=Membership(self.user).
                                                              membership_auth).\
                                                              exclude(action=self.action).\
                                                              exclude(actor__in=l).\
                                                              order_by('actor__name')
            actors = Actor.objects.filter(pk__in=[a['actor__pk'] for a in actors])
        except ActionM2MActor.DoesNotExist:
            actors = None
        return actors


FILE_UPLOAD_DIR = os.path.join(settings.MEDIA_ROOT, 'visualization')


def handle_uploaded_file(source):
    fd, filepath = tempfile.mkstemp(suffix=source.name, dir=FILE_UPLOAD_DIR)
    with open(filepath, 'wb') as dest:
        shutil.copyfileobj(source, dest)
    return str(filepath).split('/')[-1]


def make_tree(pc_list, root_node):
    results = {}
    for record in pc_list:
        parent_id = record[0]
        action_id = record[1]

        if action_id in results:
            node = results[action_id]
        else:
            node = results[action_id] = {}

        node['name'] = record[2]
        node['id'] = 'node{0}'.format(record[3])
        node['data'] = {
            "status": record[4]
        };
        if parent_id != action_id:
            if parent_id in results:
                parent = results[parent_id]
            else:
                parent = results[parent_id] = {}
            if 'children' in parent:
                parent['children'].append(node)
            else:
                parent['children'] = [node]

    # assuming we wanted node id #0 as the top of the tree
    return results[root_node]





