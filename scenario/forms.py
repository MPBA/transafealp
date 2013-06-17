# -*- encoding: utf-8 -*-
__author__ = 'ernesto (arbitrio@fbk.eu)'

from django import forms
from autocomplete.utils import autocomplete_formfield
from scenario.models import Scenario, ScenarioSubcategory, ScenarioCategory, Action, Actor, Visualization, ManagingAuthority


class ScenarioAddForm(forms.Form):
    subcategory = forms.ModelChoiceField(queryset=ScenarioSubcategory.objects.all().order_by('category__name'), widget=forms.Select(attrs={'required': 'True'}))
    name = forms.CharField(widget=forms.TextInput(attrs={'required': 'True'}))
    description = forms.CharField(widget=forms.Textarea(attrs={'class': 'field span6', 'required': 'True'}))
    geometry = forms.CharField(widget=forms.Textarea(attrs={'style': 'display:none'}))


class ScenarioEditForm(forms.ModelForm):
    subcategory = forms.ModelChoiceField(queryset=ScenarioSubcategory.objects.all().order_by('category__name'), widget=forms.Select(attrs={'required': 'True'}))
    name = forms.CharField(widget=forms.TextInput(attrs={'required': 'True'}))
    description = forms.CharField(widget=forms.Textarea(attrs={'class': 'field span6', 'required': 'True'}))
    class Meta:
        model = Scenario
        exclude = ('geom',)


class ActionAddForm(forms.ModelForm):
    name = forms.CharField(widget=forms.Textarea(attrs={'class': 'field span5', 'required': 'True', 'rows': '3'}))
    description = forms.CharField(widget=forms.Textarea(attrs={'class': 'field span10', 'required': 'True'}))
    numcode = forms.CharField(widget=forms.TextInput(attrs={'required': 'True'}))
    duration = forms.CharField(widget=forms.TextInput(attrs={'class': 'span2', 'required': 'True', 'onRelease': 'checkDuration();'}))

    class Meta:
        model = Action
        exclude = ('scenario',)


class ActorAddForm(forms.ModelForm):
    name = forms.CharField(widget=forms.Textarea(attrs={'required': 'True', 'class': 'field span3', 'rows': '3'}))
    istitution = forms.CharField(widget=forms.Textarea(attrs={'required': 'True', 'class': 'field span5'}))
    contact_info = forms.CharField(widget=forms.Textarea(attrs={'required': 'True', 'class': 'field span4', 'rows': '4'}))
    email = forms.CharField(widget=forms.Textarea(attrs={'required': 'True', 'class': 'field span3', 'rows': '3'}))
    phone = forms.CharField(widget=forms.Textarea(attrs={'required': 'True', 'class': 'field span2', 'rows': '3'}))

    class Meta:
        model = Actor

class SelectActionForm(forms.Form):
    actions = forms.ModelChoiceField(queryset=Action.objects.all().order_by('name'), widget=forms.Select(attrs={'required': 'True'}))
    def __init__(self, actions, *args, **kwargs):
        # call the standard init first
        super(SelectActionForm, self).__init__(*args, **kwargs)
        # now customise your field
        self.fields['actions'].queryset = actions


class ActionGraphAddForm(forms.Form):
    action = forms.ModelChoiceField(queryset=Action.objects.filter().order_by('name'), widget=forms.Select(attrs={'required': 'True'}))

    def __init__(self, actions_allowed, *args, **kwargs):
        # call the standard init first
        super(ActionGraphAddForm, self).__init__(*args, **kwargs)
        # now customise your field
        self.fields['action'].queryset = actions_allowed


class VisualizationForm(forms.Form):
    description = forms.CharField(widget=forms.Textarea(attrs={'required': 'True', 'class': 'field span3', 'rows': '2', 'placeholder': 'Description'}))

    class Meta:
        model = Visualization
        exclude = ('action', 'type')


class StartActionForm(forms.Form):
    managing_authority = forms.ModelChoiceField(queryset=ManagingAuthority.objects.all(), widget=forms.Select(attrs={'required': 'True'}))
    category = forms.ModelChoiceField(queryset=ScenarioSubcategory.objects.all().order_by('name'), widget=forms.Select(attrs={'required': 'True'}))

    def __init__(self, category, managing_authority, *args, **kwargs):
        #print managing_authority
        # call the standard init first
        super(StartActionForm, self).__init__(*args, **kwargs)
        self.fields['category'].empty_label = None
        self.fields['managing_authority'].empty_label = None
        # now customize the field
        self.fields['category'].queryset = category
        self.fields['managing_authority'].queryset = managing_authority

class SelectScenarioForm(forms.Form):
    scenario = forms.ModelChoiceField(queryset=Scenario.objects.all().order_by('name'), widget=forms.Select(attrs={'required': 'True'}))

    def __init__(self, scenarios, *args, **kwargs):
        #print managing_authority
        # call the standard init first
        super(SelectScenarioForm, self).__init__(*args, **kwargs)
        self.fields['scenario'].queryset = scenarios
