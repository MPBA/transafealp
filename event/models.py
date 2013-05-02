# -*- encoding: utf-8 -*-
__author__ = 'ernesto (arbitrio@fbk.eu)'

from django.db import models
from django.contrib.auth.models import User
from django.db import connection, transaction
from scenario.models import Action

class Event(models.Model):
    id = models.BigIntegerField(primary_key=True)
    scenario = models.ForeignKey('Scenario')
    status = models.TextField()
    is_real = models.BooleanField()
    time_start = models.DateTimeField(null=True, blank=True)
    time_end = models.DateTimeField(null=True, blank=True)
    geom = models.TextField()

    class Meta:
        db_table = 'event'

    def __unicode__(self):
        return u'%s %s %s' % (self.id, self.scenario, self.status)


class EventAction(models.Model):
    id = models.BigIntegerField(primary_key=True)
    event = models.ForeignKey(Event)
    action = models.ForeignKey(Action)
    status = models.TextField()

    class Meta:
        db_table = 'event_action'

    def __unicode__(self):
        return u'%s %s %s' % (self.event, self.action, self.status)


class EventActionLog(models.Model):
    id = models.BigIntegerField(primary_key=True)
    event_action = models.ForeignKey(EventAction)
    ts = models.DateTimeField()
    status = models.TextField()
    annotation = models.TextField(blank=True)

    class Meta:
        db_table = 'event_action_log'

    def __unicode__(self):
        return u'%s %s %s' % (self.id, self.event_action, self.status)


class EventAnnotationLog(models.Model):
    id = models.BigIntegerField(primary_key=True)
    event = models.ForeignKey(Event)
    ts = models.DateTimeField()
    annotation = models.TextField()

    class Meta:
        db_table = 'event_annotation_log'

    def __unicode__(self):
        return u'%s %s' % (self.event, self.ts)


class EventStaticLog(models.Model):
    id = models.BigIntegerField(primary_key=True)
    event = models.ForeignKey(Event)
    ts = models.DateTimeField()
    action_type = models.TextField()
    action_id = models.BigIntegerField(null=True, blank=True)
    action_name = models.TextField(blank=True)
    action_description = models.TextField(blank=True)
    action_value = models.TextField()
    annotation = models.TextField(blank=True)

    class Meta:
        db_table = 'event_static_log'

    def __unicode__(self):
        return u'%s %s' % (self.event, self.ts)

