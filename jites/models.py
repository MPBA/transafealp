# -*- encoding: utf-8 -*-
__author__ = 'ernesto (arbitrio@fbk.eu)'

from django.db import models
from scenario.models import ManagingAuthority
from djorm_hstore.fields import DictionaryField
from djorm_hstore.models import HStoreManager


class EvAction(models.Model):
    event = models.ForeignKey('Event')
    name = models.TextField()
    numcode = models.IntegerField()
    description = models.TextField()
    duration = models.IntegerField()
    status = models.TextField()
    comment = models.TextField(blank=True)

    class Meta:
        db_table = 'ev_action'

    def __unicode__(self):
        return u'%s' % self.name


class EvActionGraph(models.Model):
    action = models.ForeignKey(EvAction)
    parent = models.ForeignKey(EvAction, related_name='parent')
    is_main_parent = models.BooleanField()

    class Meta:
        db_table = 'ev_action_graph'

    def __unicode__(self):
        return u'%s %s' % (self.action, self.parent)


class EvActionM2MActor(models.Model):
    action = models.ForeignKey(EvAction)
    actor = models.ForeignKey('EvActor')

    class Meta:
        db_table = 'ev_action_m2m_actor'

    def __unicode__(self):
        return u'%s %s' % (self.action, self.actor)


class EvActor(models.Model):
    event = models.ForeignKey('Event')
    name = models.TextField()
    istitution = models.TextField()
    contact_info = models.TextField()
    email = models.TextField()
    phone = models.TextField()

    class Meta:
        db_table = 'ev_actor'

    def __unicode__(self):
        return u'%s %s' % (self.name, self.istitution)


class EvMessage(models.Model):
    event = models.ForeignKey('Event')
    ts = models.DateTimeField()
    username = models.TextField()
    content = models.TextField()

    class Meta:
        db_table = 'ev_message'

    def __unicode__(self):
        return u'%s %s' % (self.event, self.content)


class EvVisualization(models.Model):
    action = models.ForeignKey(EvAction)
    description = models.TextField(blank=True)
    type = models.TextField()
    resource = models.TextField()
    options = models.TextField(blank=True)

    class Meta:
        db_table = 'ev_visualization'

    def __unicode__(self):
        return u'%s %s' % (self.description, self.type)


class Event(models.Model):
    managing_authority = models.ForeignKey(ManagingAuthority, null=True, blank=True)
    event_name = models.TextField()
    event_description = models.TextField()
    category_name = models.TextField()
    category_description = models.TextField()
    subcategory_name = models.TextField()
    subcategory_description = models.TextField()
    status = models.TextField()
    is_real = models.BooleanField()
    time_start = models.DateTimeField()
    time_end = models.DateTimeField(null=True, blank=True)
    event_geom = models.TextField()
    scenario_geom = models.TextField()

    class Meta:
        db_table = 'event'

    def __unicode__(self):
        return u'%s %s' % (self.event_name, self.status)

    def as_dict(self):
        return {
            'pk': self.pk,
            'managing_authority': self.managing_authority.name,
            'event_name': self.event_name,
            'event_description': self.event_description,
            'category_name': self.category_name,
            'category_description': self.category_description,
            'subcategory_name': self.subcategory_name,
            'subcategory_description': self.subcategory_description,
            'status': self.status,
            'is_real': self.is_real,
            'time_start': self.time_start.strftime('%Y-%m-%d %H:%M:%S'),
        }


class EventLog(models.Model):
    event = models.ForeignKey(Event)
    txid = models.IntegerField()
    ts = models.DateTimeField()
    table_name = models.TextField()
    action = models.TextField()
    row_id = models.IntegerField()
    fields = DictionaryField(db_index=True)
    new_fields = DictionaryField(db_index=True)
    objects = HStoreManager()


    class Meta:
        db_table = 'event_log'

    def __unicode__(self):
        return u'%s %s' % (self.event, self.action)
