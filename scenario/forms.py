# -*- encoding: utf-8 -*-
__author__ = 'ernesto (arbitrio@fbk.eu)'

from django import forms
from autocomplete.utils import autocomplete_formfield
from scenario.models import Scenario, ScenarioSubcategory, ScenarioCategory, Action, Actor, Visualization

class ScenarioAddForm(forms.Form):
    subcategory = forms.ModelChoiceField(queryset=ScenarioSubcategory.objects.all().order_by('category__name'), widget=forms.Select(attrs={'required': 'True'}))
    name = forms.CharField(widget=forms.TextInput(attrs={'required': 'True'}))
    description = forms.CharField(widget=forms.Textarea(attrs={'class': 'field span6', 'required': 'True'}))
    geometry = forms.CharField(widget=forms.Textarea(attrs={'style': 'display:none'}))


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


class ActionGraphAddForm(forms.Form):
    action = forms.ModelChoiceField(queryset=Action.objects.filter().order_by('name'), widget=forms.Select(attrs={'required': 'True'}))
    def __init__(self, actions_allowed, *args, **kwargs):
        # call the standard init first
        super(ActionGraphAddForm, self).__init__(*args, **kwargs)
        # now customise your field
        self.fields['action'].queryset = actions_allowed


class VisualizationForm(forms.ModelForm):
    description = forms.CharField(widget=forms.Textarea(attrs={'required': 'True', 'class': 'field span3', 'rows': '2', 'placeholder': 'Description'}))
    #type = forms.CharField(widget=forms.TextInput(attrs={'required': 'True', 'class': 'field span3', 'placeholder': 'Type'}))

    class Meta:
        model = Visualization
        exclude = ('action', 'type')



