# -*- encoding: utf-8 -*-
__author__ = 'ernesto (arbitrio@fbk.eu)'

from django.contrib import admin
from scenario.models import *
from autocomplete.views import autocomplete, AutocompleteSettings
from autocomplete.admin import AutocompleteAdmin


class SubCatAdmin(AutocompleteAdmin, admin.ModelAdmin):
    list_display = ('name', 'description', 'category')
    list_filter = ('category',)
    search_fields = ['name', 'category__name']
    autocomplete_fields = {'category': {'search_fields': '^name', 'add_button': True, 'lookup': True}, }


class AuthManagerAdmin(AutocompleteAdmin, admin.ModelAdmin):
    list_display = ('name', 'email', 'phone', 'auth_user')
    search_fields = ['name']
    autocomplete_fields = {'auth_user': {'search_fields': '^username', 'add_button': True, 'lookup': True}, }


class ActorAdmin(admin.ModelAdmin):
    list_display = ('name', 'istitution','contact_info')
    search_fields = ['name','istitution']


class ActionAdmin(AutocompleteAdmin, admin.ModelAdmin):
    list_display = ('name', 'scenario', 'numcode')
    list_filter = ('scenario',)
    search_fields = ['name', 'scenario__name']
    autocomplete_fields = {'scenario': {'search_fields': '^name', 'add_button': False, 'lookup': True}}


class ScenarioAdmin(AutocompleteAdmin, admin.ModelAdmin):
    list_display = ('name', 'subcategory', 'managing_authority')
    list_filter = ('managing_authority', 'subcategory')
    search_fields = ['name', 'managing_authority__name', 'subcategory__name']
    autocomplete_fields = {
        'managing_authority': {'search_fields': '^name', 'add_button': False, 'lookup': True},
        'subcategory': {'search_fields': '^name', 'add_button': False, 'lookup': True}
    }




admin.site.register(Scenario, ScenarioAdmin)
admin.site.register(ScenarioCategory)
admin.site.register(ScenarioSubcategory, SubCatAdmin)
admin.site.register(Action, ActionAdmin)
admin.site.register(Actor, ActorAdmin)
admin.site.register(ActionGraph)
admin.site.register(ManagingAuthority, AuthManagerAdmin)
admin.site.register(Visualization)
