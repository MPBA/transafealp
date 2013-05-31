# -*- encoding: utf-8 -*-
__author__ = 'ernesto (arbitrio@fbk.eu)'
from .models import EvActionM2MActor, EvActor
from scenario.utility import Membership
import json


class SetEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, set):
            return list(obj)
        return json.JSONEncoder.default(self, obj)


class Actor_Action_Association(object):
    def __init__(self, user, event, action):
        self.user = user
        self.event = event
        self.action = action

    def actors_already_assigned_to_this_action(self):
        try:
            actors = EvActionM2MActor.objects.filter(action__event__managing_authority=Membership(self.user).
                                                   membership_auth, action__event=self.event).\
                                                   filter(action=self.action).order_by('actor__name')
        except EvActionM2MActor.DoesNotExist:
            actors = None
        return actors

    def actors_av_for_this_action(self, l):
        try:
            actors = EvActionM2MActor.objects.values('actor__pk').annotate().\
                                                              filter(action__event__managing_authority=Membership(self.user).
                                                              membership_auth).\
                                                              exclude(action=self.action).\
                                                              exclude(actor__in=l).\
                                                              order_by('actor__name')
            actors = EvActor.objects.filter(pk__in=[a['actor__pk'] for a in actors])
        except EvActionM2MActor.DoesNotExist:
            actors = None
        return actors


def make_tree(pc_list, root_node):
    results = {}
    for record in pc_list:
        parent_id = record[0]
        action_id = record[1]

        if action_id in results:
            node = results[action_id]
        else:
            node = results[action_id] = {}

        node['id'] = 'node{0}'.format(record[1])
        node['name'] = record[2]
        node['data'] = {
            "numcode": record[3],
            "description": record[4],
            "duration": record[5],
            "status": record[6],
            "comment": record[7]
        }

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