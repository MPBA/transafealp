from django.db import connection, transaction, DatabaseError
from django.contrib.gis.db import models

# ===========================================================================
# API stuff
# ===========================================================================


def get_system_catalogs(catalog_class, group_index):
    return catalog_class.objects.filter(group=group_index)

# ===========================================================================
# Raw cursor related stuff
# ===========================================================================


def pg_run(cursor, proc_name, args=None):
    """
    Basically a thin wrapper around `cursor.callproc`
    It returns the cursor itself to allow chained calls.
    e.g.: pg_run(cursor, u'gt_elements_by_label', args).fetchall()
    """
    if args is None:
        args = []
    cursor.callproc(proc_name, args)
    return cursor


# ===========================================================================
# GeoTree common utils
# ===========================================================================

class GeoTreeError(DatabaseError):
    def __init__(self, message):
        super(GeoTreeError, self).__init__(message)

    @classmethod
    def from_database_error(cls, error):
        # TODO: create new instance of GeoTreeError
        # e.g.: instanciate a new cls() using `error` somehow.
        # For now it just returns the exception itself
        return error


class GeoTreeModel(models.Model):
    def save(self, *args, **kwargs):
        for field in self._meta.fields:
            if isinstance(field, (models.CharField, models.TextField)):
                if getattr(self, field.name) == u'':
                    setattr(self, field.name, None)
        try:
            super(GeoTreeModel, self).save(*args, **kwargs)
        except DatabaseError as dberr:
            raise GeoTreeError.from_database_error(dberr)

    def delete(self, using=None):
        try:
            super(GeoTreeModel, self).delete(using=using)
        except DatabaseError as dberr:
            raise GeoTreeError.from_database_error(dberr)

    class Meta(object):
        abstract = True
        managed = False
        app_label = u'pybab'

