from django.http import HttpResponseNotFound
from django.utils.translation import ugettext as _
from tojson import login_required_json
from ..models.base import get_system_catalogs
from ..models.catalog import LayerMeta, CatalogLayer


def get_subtree_for(group_index, group_class, catalog_class, extra_data=None):
    """
    Given a tree index, return all the json to send to the client.
    """
    if extra_data is None:
        extra_data = []

    try:
        root = group_class.objects.get(pk=group_index)
    except group_class.DoesNotExist:
        return {'success': 'false',
                'message': '{0} is not a valid index for {1}'
                .format(group_index, group_class.__name__)},\
               {'cls': HttpResponseNotFound}

    folders = [group.serialize([{'leaf': False}]) for group in root.children]

    public_catalogs = \
        [cat.serialize(extra_data + [{'leaf': True}, {'public': True}])
         for cat in get_system_catalogs(catalog_class, group_index)]

    return {'success': 'true',
            'requested': root.serialize(),
            'data': list(folders) + list(public_catalogs)}

login_required_json_default = login_required_json(
    {'success': False, 'message': _("Logging in is required for this action")})


def get_metadata_for(layer_index):
    """
    Given a CatalogLayer index, return all the metadata (as json) related to
    that CatalogLayer
    """
    try:
        layer = CatalogLayer.objects.get(id=layer_index)
        meta = layer.metadata
    except CatalogLayer.DoesNotExist:
        return {'success': 'false', 'message':
                '{0} is not a valid index for CatalogLayer'.format(layer_index)}
    except LayerMeta.DoesNotExist:
        return {'success': 'false', 'message':
                'No metadata found for CatalogLayer {0}'.format(layer_index)}
    # fixme: is 'requested' actually useful?
    return {'success': 'true', 'requested': layer.serialize(),
            'data': meta.serialize()}
