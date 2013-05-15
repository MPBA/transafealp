# Create your views here.
from django.shortcuts import render_to_response
from django.contrib.auth.decorators import login_required
from django.template import RequestContext

@login_required
def emergency(request, displaymode):
    context = {
        'displaymode': displaymode,
        'username': request.user
    }

    return render_to_response('jites/emergency.html', context, context_instance=RequestContext(request))