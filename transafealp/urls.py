# -*- coding: utf-8 -*-

from django.conf.urls import patterns, include, url
# Uncomment the next two lines to enable the admin:
from django.contrib import admin
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from autocomplete.views import autocomplete
from django.conf.urls.static import static
from django.conf import settings
from plrutils import urls
from .views import MainView

admin.autodiscover()

urlpatterns = patterns('',

        #################### ADMIN APPS URLS #######################
        (r'^admin_tools/', include('admin_tools.urls')),
        (r'^admin/', include(admin.site.urls)),
        ('^autocomplete/', include(autocomplete.urls)),
        ('^pages/', include('django.contrib.flatpages.urls')),

        #################### PLRUTILS URLS #########################
        (r'plr/', include(urls.urlpatterns)),

        #################### MAIN VIEWS URLS AND AUTH URLS #########################
        (r'^$', MainView.as_view()),
        (r'^accounts/login/$', 'django.contrib.auth.views.login', {'template_name': 'registration/login.html'}),
        (r'^accounts/logout/$', 'django.contrib.auth.views.logout', {'next_page': '/accounts/login'}),

        #################### SCENARIO URLS #########################
        (r'^scenario/',   include('scenario.urls')),

        #################### JITES URLS #########################
        (r'^jites/',   include('jites.urls')),

        #################### LAYER MAP URLS ########################
        (r'^layer_map/', include('layer_map.urls')),

) + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

urlpatterns += staticfiles_urlpatterns()
