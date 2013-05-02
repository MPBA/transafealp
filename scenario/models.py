# -*- encoding: utf-8 -*-
__author__ = 'ernesto (arbitrio@fbk.eu)'

from django.db import models
from django.contrib.auth.models import User
from django.db import connection, transaction

#scenario app
class ManagingAuthority(models.Model):
    auth_user = models.ForeignKey(User)
    name = models.TextField(unique=True)
    description = models.TextField()
    address = models.TextField()
    email = models.TextField()
    phone = models.TextField()
    class Meta:
        db_table = 'managing_authority'
        verbose_name = 'Managing Authority'
        verbose_name_plural = 'Managin Authorities'
        ordering = ['name']

    def __unicode__(self):
        return u'%s' % (self.name)


#scenario app
class Scenario(models.Model):
    managing_authority = models.ForeignKey(ManagingAuthority)
    subcategory = models.ForeignKey('ScenarioSubcategory', null=True, blank=True)
    name = models.TextField(unique=True)
    description = models.TextField()
    geom = models.TextField(blank=True)

    def save(self):
        cursor = connection.cursor()

        if self.pk == None:
            cursor.execute("INSERT INTO scenario VALUES (DEFAULT, %s, %s, %s, %s, %s)",
                           [self.managing_authority.pk, self.subcategory.pk, self.name, self.description, self.geom])
        else:
            cursor.execute("UPDATE scenario SET managing_authority_id=%s, subcategory_id=%s, name=%s, description=%s, geom=%s WHERE id=%s",
                           [self.managing_authority.pk, self.subcategory.pk, self.name, self.description, self.geom, self.pk])

        transaction.commit_unless_managed()

    class Meta:
        db_table = 'scenario'
        verbose_name = 'Scenario'
        verbose_name_plural = 'Scenarios'
        ordering = ['name', 'subcategory']

    def __unicode__(self):
        return u'%s %s' % (self.name, self.subcategory)


#scenario app
class ScenarioCategory(models.Model):
    name = models.TextField(unique=True)
    description = models.TextField()
    class Meta:
        db_table = 'scenario_category'
        verbose_name = 'Scenario Category'
        verbose_name_plural = 'Scenario Categories'
        ordering = ['name']

    def __unicode__(self):
        return u'%s' % (self.name)


#scenario app
class ScenarioSubcategory(models.Model):
    category = models.ForeignKey(ScenarioCategory, null=True, blank=True, verbose_name='Parent')
    name = models.TextField(unique=True)
    description = models.TextField()
    class Meta:
        db_table = 'scenario_subcategory'
        verbose_name = 'Scenario SubCategory'
        verbose_name_plural = 'Scenario SubCategories'
        ordering = ['name']

    def __unicode__(self):
        return u'%s' % (self.name)


class Actor(models.Model):
    name = models.TextField()
    istitution = models.TextField()
    contact_info = models.TextField()
    email = models.TextField(unique=True)
    phone = models.TextField()

    class Meta:
        db_table = 'actor'

    def __unicode__(self):
        return u'%s' % (self.name)


#scenario app
class Action(models.Model):
    scenario = models.ForeignKey('Scenario')
    name = models.TextField()
    numcode = models.IntegerField()
    description = models.TextField()

    class Meta:
        db_table = 'action'

    def __unicode__(self):
        return u'%s %s' % (self.name, self.scenario)


#scenario app
class ActionGraph(models.Model):
    action = models.ForeignKey(Action)
    parent = models.ForeignKey(Action, related_name="parent")
    is_main_parent = models.BooleanField()

    class Meta:
        db_table = 'action_graph'
        verbose_name = 'Action Graph'
        verbose_name_plural = 'Action Graphs'

    def __unicode__(self):
        return u'%s %s %s' % (self.action, self.parent, self.is_main_parent)


#scenario app
class ActionM2MActor(models.Model):
    action = models.ForeignKey(Action)
    actor = models.ForeignKey(Actor)
    class Meta:
        db_table = 'action_m2m_actor'


#scenario app
class Visualization(models.Model):
    action = models.ForeignKey(Action)
    description = models.TextField(blank=True)
    type = models.TextField()
    content = models.TextField()
    class Meta:
        db_table = 'visualization'
        verbose_name = 'Visualization'
        verbose_name_plural = 'Visualizations'

    def __unicode__(self):
        return u'%s %s %s' % (self.action, self.description, self.type)

