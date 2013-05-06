# -*- encoding: utf-8 -*-
__author__ = 'ernesto (arbitrio@fbk.eu)'

from django.contrib import admin
from scenario.models import *
from autocomplete.views import autocomplete, AutocompleteSettings
from autocomplete.admin import AutocompleteAdmin
from django import forms
from django.db import models


class ActionInline(admin.TabularInline):
    model = Action
    can_delete = True
    allow_add = True
    fk_name = "scenario"
    extra = 5


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
    inlines = [
        ActionInline,
    ]

class ActionGraphAdmin(admin.ModelAdmin):
    list_display = ('parent', 'action')
    search_fields = ['parent__name', 'action__name']

class ActionM2MActorAdmin(AutocompleteAdmin, admin.ModelAdmin):
    list_display = ('action', 'actor')
    list_filter = ('actor',)
    search_fields = ['actor__name', 'action__name']
    autocomplete_fields = {
        'actor': {'search_fields': '^name', 'add_button': True, 'lookup': True},
        'action': {'search_fields': '^name', 'add_button': True, 'lookup': True},
    }

admin.site.register(Scenario, ScenarioAdmin)
admin.site.register(ScenarioCategory)
admin.site.register(ScenarioSubcategory, SubCatAdmin)
admin.site.register(Action, ActionAdmin)
admin.site.register(Actor, ActorAdmin)
admin.site.register(ActionGraph, ActionGraphAdmin)
admin .site.register(ActionM2MActor, ActionM2MActorAdmin)
admin.site.register(ManagingAuthority, AuthManagerAdmin)
admin.site.register(Visualization)
