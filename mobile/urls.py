from django.conf.urls import patterns

urlpatterns = patterns('mobile.views',
                       (r'^login/', 'auth'),
                       (r'^event/list/', 'eventlist'),
                       (r'^action/list/(?P<pk>\d+)', 'actionlist'),
                       )