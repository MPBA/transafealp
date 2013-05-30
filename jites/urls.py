#from kitchen.text.display import _generate_combining_table

__author__ = 'droghetti'
from django.conf.urls import patterns
from .views import EventDetailView

urlpatterns = patterns('jites.views',
   (r'emergency/log/annotation$', 'annotation', ),
   (r'poll/$', 'poll', ),

   (r'event/(?P<scenario_id>\d+)/(?P<type>\w+)$', 'select_event_location' ),
   (r'event/(?P<scenario_id>\d+)/(?P<type>\w+)/start$', 'start_event' ),
   (r'dashboard/(?P<displaymode>\w+)/(?P<event_id>\d+)$', 'dashboard' ),
   (r'get_event/(?P<pk>\d+)$', EventDetailView.as_view() ),
   (r'event/(?P<event_id>\d+)/add/message/$', 'save_event_message')

)