from django.conf.urls import patterns, url

urlpatterns = patterns('layer_map.views',
    # catalog layer
    url(r'^layer/$', 'views.catalog_layer'),
    url(r'^layer/(?P<index>\d+)/$', 'views.catalog_layer'),
    #metadata  # todo: implement me! :D :D :D
    # url(r'^metadata/(?P<index>\d+)/$', 'views.metadata'),
)

