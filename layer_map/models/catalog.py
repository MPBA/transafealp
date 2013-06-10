from django.db import models
from pyhive.extra.django import DjangoModelSerializer
from pyhive.decorators import serializable
from layer_map.managers import GroupModelManager
from django.utils.translation import ugettext as _
from base import GeoTreeModel, GeoTreeError, pg_run

# ===========================================================================
# Utilities
# ===========================================================================

@serializable(DjangoModelSerializer())
class GenericMetadata(GeoTreeModel):
    id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    category = models.TextField(blank=True, null=True)
    extent = models.TextField(blank=True, null=True)
    measure_unit = models.TextField(blank=True, null=True)
    author = models.TextField(blank=True, null=True)
    ref_year = models.IntegerField(null=True)
    creation_year = models.IntegerField(null=True)
    native_format = models.TextField(blank=True, null=True)
    genealogy = models.TextField(blank=True, null=True)
    spatial_resolution = models.TextField(blank=True, null=True)
    ref_system = models.TextField(blank=True, null=True)
    availability = models.TextField(blank=True, null=True)
    has_attributes = models.NullBooleanField()

    class Meta(GeoTreeModel.Meta):
        abstract = True


TABLETYPE_CHOICES = (
    ('local', _('local table')),
    ('pgsql', _('pgsql foreign data wrapper')),
    ('csv', _('csv foreign data warapper')),
    ('multicorn', _('multicorn foreign data wrapper')),
)


#TODO: change to_dict after rewrite
@serializable(DjangoModelSerializer())
class CatalogModel(GeoTreeModel):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    creation_time = models.DateTimeField(auto_now_add=True)
    numcode = models.IntegerField(default=0)
    tabletype = models.TextField(choices=TABLETYPE_CHOICES, default='local')
    #tableschema = models.TextField(blank=True, null=True)
    #tablename = models.TextField(blank=True, null=True)
    #code_column = models.TextField(blank=True, null=True)
    time_column = models.TextField(blank=True, null=True)

    @property
    def catalog_type(self):
        return type(self).__name__

    @property
    def generic(self):
        return Catalog.objects.get(pk=self.pk)

    @property
    def elements(self):
        return self.generic.elements

    def __unicode__(self):
        return u'({id}, {name})'.format(id=self.id, name=self.name)

    class Meta(GeoTreeModel.Meta):
        abstract = True


@serializable(DjangoModelSerializer())
class GroupModel(GeoTreeModel):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)

    ROOT_ID = 0

    objects = GroupModelManager()

    @property
    def is_root(self):
        return self.pk == GroupModel.ROOT_ID

    @property
    def parent(self):
        if self.is_root:
            return None
        else:
            return type(self).objects.get(parent_tree__group=self)

    @parent.setter
    def parent(self, newparent):
        if self.is_root:
            raise GeoTreeError('can not modify parent for root element')
        elif self.pk is None:
            raise GeoTreeError('can not set parent for unsaved objects')
        else:
            self.child_tree.all().delete()
            self.child_tree.create(group=self, parent_group=newparent)

    @property
    def children(self):
        return type(self).objects.filter(child_tree__parent_group=self).exclude(
            pk=GroupModel.ROOT_ID)

    def __unicode__(self):
        return u'({id}, {name})'.format(id=self.id, name=self.name)

    class Meta(GeoTreeModel.Meta):
        abstract = True


# ===========================================================================
# Catalog
# ===========================================================================


class Catalog(GeoTreeModel):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    creation_time = models.DateTimeField(auto_now_add=True)
    numcode = models.IntegerField(default=0)
    tabletype = models.TextField(choices=TABLETYPE_CHOICES, default='local')
    tableschema = models.TextField(blank=True, null=True)
    tablename = models.TextField(blank=True, null=True)
    code_column = models.TextField(blank=True, null=True)
    time_column = models.TextField(blank=True, null=True)

    def save(self, force_insert=False, force_update=False):
        raise GeoTreeError("Can not update gt_catalog directly")

    def delete(self, using=None):
        raise GeoTreeError("Can not delete from gt_catalog directly")

    def __unicode__(self):
        return u"({0}, {1})".format(self.id, self.name)

    class Meta(GeoTreeModel.Meta):
        db_table = u'gt_catalog'

#
# ===========================================================================
# Catalog Layer
# ===========================================================================


class CatalogLayer(CatalogModel):
    tableschema = models.TextField(blank=True, null=True)
    tablename = models.TextField(blank=True, null=True)
    code_column = models.TextField(blank=True, null=True)
    group = models.ForeignKey('LayerGroup',
                              default=lambda: LayerGroup.objects.get(pk=1))
    gt_style = models.ForeignKey('Style', null=True, default=lambda: None)
    geom_column = models.TextField(null=True, blank=True)
    ui_qtip = models.CharField(max_length=255, blank=True, null=True)
    gs_name = models.CharField(max_length=255)
    gs_workspace = models.CharField(max_length=255, blank=True, null=True)
    gs_url = models.CharField(max_length=255)
    gs_legend_url = models.CharField(max_length=255)

    def import_elements_from(self, name_column, parent_column, elements_rank):
        if self.tablename is None or self.tablename == "":
            raise GeoTreeError("Can't import layer into catalog because "
                               "tablename is not defined.")
        args = [self.pk, name_column, parent_column, elements_rank]
        return pg_run(u'gt_layer_import', args)

    class Meta(CatalogModel.Meta):
        unique_together = ('tableschema', 'tablename',
                           'code_column', 'geom_column')
        db_table = u'gt_catalog_layer'


class LayerGroup(GroupModel):
    class Meta(GroupModel.Meta):
        db_table = u'gt_layer_group'


class LayerTree(GeoTreeModel):
    id = models.AutoField(primary_key=True)
    group = models.ForeignKey(LayerGroup, unique=True,
                              related_name="child_tree")
    parent_group = models.ForeignKey(LayerGroup, related_name="parent_tree")

    class Meta(GroupModel.Meta):
        db_table = u'gt_layer_tree'


class LayerMeta(GenericMetadata):
    layer = models.OneToOneField('CatalogLayer', related_name='metadata')

    class Meta(GenericMetadata.Meta):
        db_table = u'gt_layer_meta'
