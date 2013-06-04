from django.core.exceptions import ObjectDoesNotExist
from .api_settings import MAX_GROUPS


def add_metadata(obj, current, *args, **kwargs):
    try:
        metadata = obj.metadata.serialize()
    except AttributeError:
        metadata = None

    current['metadata'] = metadata
    return current


def alter_id(obj, current, *args, **kwargs):
    current.update({'id': obj.id * MAX_GROUPS,
                    'real_id': obj.id})
    return current