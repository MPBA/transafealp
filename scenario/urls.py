__author__ = 'ernesto'

from django.conf.urls import patterns, include, url

urlpatterns = patterns('scenario.views',

        (r'^add/$', 'scenario_add'),
        (r'^list/$', 'scenario_list'),

)
