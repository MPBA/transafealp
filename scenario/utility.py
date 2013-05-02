# -*- encoding: utf-8 -*-
__author__ = 'ernesto (arbitrio@fbk.eu)'
from .models import ManagingAuthority

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
            ma = ManagingAuthority.objects.get(pk=self.user_id)
        except ManagingAuthority.DoesNotExists:
            ma = None
        return ma



