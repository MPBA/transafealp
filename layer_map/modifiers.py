from .api_settings import MAX_GROUPS
from layer_map.models.catalog import LayerMeta


def add_metadata(obj, current, *args, **kwargs):
    try:
        metadata = obj.metadata.serialize()
    except (obj.DoesNotExist, LayerMeta.DoesNotExist):
        metadata = None

    current['metadata'] = metadata
    return current


def alter_id(obj, current, *args, **kwargs):
    current.update({'id': obj.id * MAX_GROUPS,
                    'real_id': obj.id})
    return current