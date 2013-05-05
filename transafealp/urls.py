# -*- coding: utf-8 -*-

from django.conf.urls import patterns, include, url
# Uncomment the next two lines to enable the admin:
from django.contrib import admin
from autocomplete.views import autocomplete


admin.autodiscover()

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'transafealp.views.home', name='home'),
    # url(r'^transafealp/', include('transafealp.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
        (r'^admin_tools/', include('admin_tools.urls')),
        (r'^admin/', include(admin.site.urls)),
        ('^autocomplete/', include(autocomplete.urls)),
        # include the lookup urls
        (r'^$', 'transafealp.views.main_view'),
        (r'^accounts/login/$', 'django.contrib.auth.views.login', {'template_name': 'registration/login.html'}),
        (r'^accounts/logout/$', 'django.contrib.auth.views.logout', {'next_page': '/accounts/login'}),

        #################### SCENARIO URLS #########################
        (r'^scenario/',   include('scenario.urls')),

)
