# Create your views here.
from tojson import render_to_json
from commons import login_required_json_default, get_subtree_for, \
    get_metadata_for
from ..modifiers import add_metadata, alter_id
from ..models.catalog import CatalogLayer, LayerGroup

@login_required_json_default
@render_to_json(mimetype='text/html')
def catalog_layer(request, index=0):
    index = int(index)

    if request.method == 'GET':
        return get_subtree_for(
            index, LayerGroup, CatalogLayer,
            extra_data=[add_metadata, alter_id, {'checked': False}])


@login_required_json_default
@render_to_json(mimetype='text/html')
def metadata(request, index=0):
    index = int(index)

    return get_metadata_for(index)

