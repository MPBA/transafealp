__author__ = 'ernesto'
from django.conf.urls import patterns, include, url

urlpatterns = patterns('scenario.views',
                       (r'^add/$', 'scenario_add'),
                       (r'^list/$', 'scenario_list'),
                       (r'^detail/(?P<scenario_id>\d+)/$', 'scenario_detail'),
                       (r'^action/add/(?P<scenario_id>\d+)/$', 'action_add'),
                       (r'^action/list/(?P<scenario_id>\d+)/$', 'actions_list'),
                       (r'^actors/list$', 'actors_list'),
                       (r'^actor/add/(?P<scenario_id>\d+)/$', 'actors_add'),
                       (r'^actor/add/popup/(?P<scenario_id>\d+)/$', 'actors_add_popup'),
                       (r'^actiongraph/add/(?P<scenario_id>\d+)/$', 'action_graph_add'),
                       (r'^actiongraph/del/(?P<scenario_id>\d+)/(?P<graph_id>\d+)/$', 'delete_action_from_graph'),
                       (r'^actor/insert/to/action/(?P<scenario_id>\d+)/$', 'insert_actors_to_action'),
                       (r'^actor/insert/to/action/(?P<scenario_id>\d+)/(?P<action_id>.*)/$', 'insert_actors_to_action'),
                       (r'^association/delete/(?P<association_id>\d+)/$', 'delete_actor_action'),
                       (r'^visualization/(?P<scenario_id>\d+)/$', 'visualization'),
                       (r'^visualization/(?P<scenario_id>\d+)/(?P<action_id>.*)/$', 'visualization'),
                       (r'^json_action/(?P<id>\d+)/$', 'json_action'),

                       )
