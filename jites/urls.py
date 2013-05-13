__author__ = 'droghetti'
from django.conf.urls import patterns

urlpatterns = patterns("jites.views",
   (r'emergency/(?P<displaymode>\w+)/$', 'emergency', ),
)