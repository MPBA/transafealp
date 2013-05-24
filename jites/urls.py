__author__ = 'droghetti'
from django.conf.urls import patterns

urlpatterns = patterns("jites.views",
   (r'emergency/log/annotation$', 'annotation', ),
   (r'poll/$', 'poll', ),

   (r'event/(?P<scenario_id>\d+)/(?P<type>\w+)$', 'select_event_location', ),
   (r'event/(?P<scenario_id>\d+)/(?P<type>\w+)/start$', 'start_event', ),
   (r'dashboard/(?P<displaymode>\w+)/(?P<event_id>\d+)$', 'dashboard', ),
)