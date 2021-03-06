# -*- encoding: utf-8 -*-
__author__ = 'ernesto'

#This file contains only the views for the main app. It's made just to render an home page for the project
from scenario.models import ManagingAuthority
from scenario.utility import Membership
from django.views.generic import TemplateView
from mixin import LoginRequiredMixin
from django.contrib.sessions.models import Session
from datetime import datetime
from django.contrib.auth.models import User
from jites.models import Event
import psutil


#class based view for home page rendering
class MainView(LoginRequiredMixin, TemplateView):
    template_name = 'transafealp/home_page.html'

    def get_context_data(self, **kwargs):
        context = super(MainView, self).get_context_data()
        try:
            managing_authority = Membership(self.request.user).membership_auth
        except ManagingAuthority.DoesNotExist:
            managing_authority = ""

        num_users_logged = Session.objects.filter(expire_date__gte=datetime.now()).count()
        tot_users = User.objects.all().count()
        all_event = Event.objects.filter(managing_authority=managing_authority).count()
        all_event_closed = Event.objects.filter(managing_authority=managing_authority, status='closed').count()
        all_event_open = Event.objects.filter(managing_authority=managing_authority, status='open').count()
        self.request.session["ma"] = managing_authority
        print all_event_open
        context['ma'] = managing_authority
        context['n_users'] = num_users_logged
        context['tot_users'] = tot_users
        context['event'] = all_event
        context['closed'] = all_event_closed
        context['open'] = all_event_open
        context['cpu'] = str("%0.2f" % float(psutil.cpu_percent()))
        context['ram'] = "%0.2f" % psutil.virtual_memory()[2]
        context['disk'] = "%0.2f" % psutil.disk_usage('/')[3]
        return context
