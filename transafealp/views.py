# -*- encoding: utf-8 -*-
__author__ = 'ernesto'

#This file contains only the views for the main app. It's made just to render an home page for the project
from scenario.models import ManagingAuthority
from scenario.utility import Membership
from django.views.generic import TemplateView
from mixin import LoginRequiredMixin


class MainView(LoginRequiredMixin, TemplateView):
    template_name = 'transafealp/home_page.html'

    def get_context_data(self, **kwargs):
        context = super(MainView, self).get_context_data()
        try:
            managing_authority = Membership(self.request.user).membership_auth
        except ManagingAuthority.DoesNotExist:
            managing_authority = ""
        self.request.session["ma"] = managing_authority
        context['ma'] = managing_authority
        return context
