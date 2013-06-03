# TransafeAlp Readme

The TranSafeAlp-JITES project aims to provide a system of knowledge to the authorities that govern the regional transport and civil
protection in order to monitor the flow of interregional traffic with the possibility of early detection of possible critical points.
Methods have been implemented for the homogenization of the information collected by the various partners in relation to road
infrastructure, the technical and administrative capacities and traffic flows information. The system allows the simulation of
emergency situations and allows to manage events resulting from blocked roads due to natural causes, accidents or planned interventions.
Shared information on the flow of cross-border traffic and their graphical representation geo-referenced enables local authorities to
take early important decisions for the safety of traffic flow and the areas traversed by them. The knowledge of these flows may suggest
interventions on infrastructure in order to minimize the inconvenience to the people involved and will evaluate possible alternative
routes in order to minimize the overall risk to the transport of dangerous substances. In the presence of special events, the competent
authorities have a tool that can simplify the choices of action and information to the people involved.

## Release Info
[WIKI page](https://github.com/MPBAUnofficial/transafealp/wiki)


## Virtualenv
    virtualenv transafealp-env --no-site-packages
    cd transafealp
    source bin/actviate #activate the env


## General Requirements

* Django==1.5.1
* South==0.7.6
* django-admin-tools==0.5.1
* django-debug-toolbar==0.9.4
* psycopg2==2.5
* wsgiref==0.1.2
* git+http://github.com/MPBAUnofficial/plrutils.git@master#egg=plrutils
* PIL
* psutil
* httplib2

```python
    pip install -r transafealp/requirements.txt
```

## Running Server

    python manage.py runserver --settings=transafealp.settings.development
