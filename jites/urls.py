__author__ = 'droghetti'
from django.conf.urls import patterns

urlpatterns = patterns("jites.views",
   (r'emergency/(?P<displaymode>\w+)/$', 'emergency', ),
   (r'emergency/log/annotation$', 'annotation', ),
   (r'poll/$', 'poll', ),

   (r'event/(?P<scenario_id>\d+)/(?P<type>\w+)$', 'select_event_location', ),
   (r'event/(?P<scenario_id>\d+)/(?P<type>\w+)/start$', 'start_live_event', ),

)