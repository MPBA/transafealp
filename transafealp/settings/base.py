# Django base settings for transafealp project.
# -*- coding: utf-8 -*-

import os

gettext = lambda s:s

PROJECT_PATH = os.path.split(os.path.realpath(os.path.dirname(__file__)))[0]

DEBUG = True
TEMPLATE_DEBUG = DEBUG


ADMINS = (
    ('Shamar Droghetti', 'droghetti@fbk.eu'),
    ('Ernesto Arbitrio', 'arbitrio@fbk.eu'),
    ('Gabriele Franch', 'franch@fbk.eu'),
)

MANAGERS = ADMINS

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2', # Add 'postgresql_psycopg2', 'mysql', 'sqlite3' or 'oracle'.
        'NAME': 'transafe_dev',                      # Or path to database file if using sqlite3.
        # The following settings are not used with sqlite3:
        'USER': 'transafe_dev',
        'PASSWORD': 'transafe2K13alp!!',
        'HOST': 'geopg',          # Empty for localhost through domain sockets or '127.0.0.1' for localhost through TCP.
        'PORT': '5432',          # Set to empty string for default.
    }
}



ALLOWED_HOSTS = ['localhost',]
INTERNAL_IPS = ('127.0.0.1',)

TIME_ZONE = 'Europe/Rome'

LANGUAGES = (
    ('en', gettext("english")),
    ('it', gettext("italian")),
)

LANGUAGE_CODE = 'en-us'

SITE_ID = 1
USE_I18N = True
USE_L10N = True
USE_TZ = True
MEDIA_ROOT = ''
MEDIA_URL = ''
# Absolute path to the directory static files should be collected to.
# Don't put anything in this directory yourself; store your static files
# in apps' "static/" subdirectories and in STATICFILES_DIRS.
# Example: "/var/www/example.com/static/"
STATIC_ROOT = ''

# URL prefix for static files.
# Example: "http://example.com/static/", "http://static.example.com/"
STATIC_URL = '/static/'

# Additional locations of static files
STATICFILES_DIRS = (
    os.path.join(PROJECT_PATH, 'static'),
    # Put strings here, like "/home/html/static" or "C:/www/django/static".
    # Always use forward slashes, even on Windows.
    # Don't forget to use absolute paths, not relative paths.
)
# List of finder classes that know how to find static files in
# various locations.
STATICFILES_FINDERS = (
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',

    #'django.contrib.staticfiles.finders.DefaultStorageFinder',
)


# Make this unique, and don't share it with anybody.
SECRET_KEY = 'aju$z286k2lj37mdcxi(3b2xu8s7yf)jdjwt17(bl-8mfq%6^7'

# List of callables that know how to import templates from various sources.
TEMPLATE_LOADERS = (
    'django.template.loaders.filesystem.Loader',
    'django.template.loaders.app_directories.Loader',
    #'django.template.loaders.eggs.Loader',
)

TEMPLATE_CONTEXT_PROCESSORS = (
    'django.core.context_processors.request',
    "django.contrib.auth.context_processors.auth",
    "django.core.context_processors.debug",
    "django.core.context_processors.i18n",
    "django.core.context_processors.media",
    "django.core.context_processors.static",
    "django.core.context_processors.tz",
    "django.contrib.messages.context_processors.messages",
)

MIDDLEWARE_CLASSES = (
    'django.middleware.common.CommonMiddleware',
    'django.middleware.locale.LocaleMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'debug_toolbar.middleware.DebugToolbarMiddleware',
    'django.middleware.transaction.TransactionMiddleware',
    # Uncomment the next line for simple clickjacking protection:
    # 'django.middleware.clickjacking.XFrameOptionsMiddleware',
)

DEBUG_TOOLBAR_PANELS = (
    'debug_toolbar.panels.version.VersionDebugPanel',
    'debug_toolbar.panels.timer.TimerDebugPanel',
    'debug_toolbar.panels.settings_vars.SettingsVarsDebugPanel',
    'debug_toolbar.panels.headers.HeaderDebugPanel',
    'debug_toolbar.panels.request_vars.RequestVarsDebugPanel',
    'debug_toolbar.panels.template.TemplateDebugPanel',
    'debug_toolbar.panels.sql.SQLDebugPanel',
    'debug_toolbar.panels.signals.SignalDebugPanel',
    'debug_toolbar.panels.logger.LoggingPanel',
)

ROOT_URLCONF = 'transafealp.urls'

# Python dotted path to the WSGI application used by Django's runserver.
WSGI_APPLICATION = 'transafealp.wsgi.application'

TEMPLATE_DIRS = (
    os.path.join(PROJECT_PATH, 'templates'),
     # Put strings here, like "/home/html/django_templates" or "C:/www/django/templates".
    # Always use forward slashes, even on Windows.
    # Don't forget to use absolute paths, not relative paths.
)

ADMIN_TOOLS_APP_INDEX_DASHBOARD = 'transafealp.dashboard.CustomAppIndexDashboard'
ADMIN_TOOLS_INDEX_DASHBOARD = 'transafealp.dashboard.CustomIndexDashboard'


INSTALLED_APPS = (
    #»»»»»»»»»»»»»3rd part app»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»
    #'south',
    'debug_toolbar',
    #django admin tools apps
    'admin_tools.theming',
    'admin_tools.menu',
    'admin_tools.dashboard',
    #-----------------------
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.sites',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # admin apps
    'django.contrib.admin',
    'django.contrib.formtools',
    #»»»»»»»»»»»»»»» transafealp apps »»»»»»»»»»»»»»»»
    'scenario',


)

# A sample logging configuration. The only tangible logging
# performed by this configuration is to send an email to
# the site admins on every HTTP 500 error when DEBUG=False.
# See http://docs.djangoproject.com/en/dev/topics/logging for
# more details on how to customize your logging configuration.

PROJECT_NAME = "Transafe Alp"
