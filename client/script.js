// Souscription aux données
//Meteor.subscribe("team-tasks");
//Meteor.subscribe("team-focus");
//Meteor.subscribe("user-tasks");

var focus_length = 25 * 60; // temps en secondes
var before_focus = 30;

var running = false;

Notification.requestPermission();

Deps.autorun(function () {

    Meteor.subscribe("all-teams");
    Meteor.subscribe("all-focus");
    Meteor.subscribe("all-tasks");
//    Meteor.subscribe("team-focus", {team: Session.get("currentTeamId")});

/*    var focus = Focus.findOne({team: Session.get('currentTeamId')}, { sort: { start_time: -1 }});
    if (focus) {
        Meteor.subscribe("focus-tasks", {focus: focus._id});
    }
*/
/*    if (Meteor.user()) {
        Meteor.subscribe("user-tasks", {user: Meteor.userId()});
    }*/
});

Meteor.setInterval(function(){Session.set("currentTime",new Date())},1000);

var avatar = function(user) {

    _.defer(function() {$("[data-toggle=tooltip]").tooltip()});

    if (user.services.twitter && user.services.twitter.profile_image_url) {
	return user.services.twitter.profile_image_url;
    }
    if (user.services.facebook && user.services.facebook.id) {
	return "http://graph.facebook.com/"+user.services.facebook.id+"/picture"
    }
    if (user.profile && user.profile.md5) {
	return "http://www.gravatar.com/avatar/"+user.profile.md5+"?s=50&d=identicon";
    }
    var initials = "AS";
    return "http://placehold.it/50x50&text="+initials;
}

var username = function(user) {
    return user.profile && user.profile.name || user.username || user.emails && user.emails[0].address || this[0];
}

var members = function(team, limit) {
    var users_id = _.unique(team.members);
    if (limit) {
	return Users.find({_id: {$in: users_id}}, {limit:limit});
    }
    return Users.find({_id: {$in: users_id}}, {sort:{_id:1}});
};

var current_task = function (user, team_id) {
    if (!user) { return; }
    var focus = Focus.findOne({team: team_id, state:{$ne:"DONE"}}, {sort: {start_time: -1}});
    if (focus) {
	return Tasks.findOne({focus: focus._id, user:user._id});
    }
}

var completion = function(team_id) {
    var focus = Focus.findOne({team: team_id}, { sort: { start_time: -1 }});
    if (!focus) {return 0;}
    var remaining = (focus.end_time - Session.get("currentTime"))/1000;
    if (focus.state == "WAITING") {
	return (100 * (remaining-focus_length) / before_focus);
    }
    if (focus.state == "DONE") { return 100; }
    if (focus.state == "EVALUATING") { return 100; }
    return 100 - (100 * remaining / focus_length);
}

Meteor.Router.add({
    '/': 'home',
    '/team': 'team_add',
    '/team/:id': function(id) {
        Session.set('currentTeamId', id);
        return 'team';
    },
/*    '/user/:id': function(id) {
        Session.set('currentTeamId', id);
        return 'user_detail';
    },*/
    '*': '404'
});

Meteor.Router.beforeRouting = function(route) {
    document.title = "Collective Focus";
    running = false;
    $("body").removeClass();
    if (route.path == "/") {
        $("body").addClass("home");
    } else {
        $("body").addClass(route.path.substr(1));
    }
}

Template.header.user = function () {
    if (Meteor.user()) {
	return Meteor.user().username;
    } else {
	return "Not connected";
    }
};
Template.header.status = function() {
    return Meteor.status().status
}


Template.header.first_name = function () { return Meteor.user().profile.first_name; };
Template.header.avatar = function () { return avatar(Meteor.user()); };

Template.home.team = function() { return Teams.find(); }

Template.team_summary.members = function() { return members(this); }
Template.team_summary.first_members = function() { return members(this, 5); }
Template.completion.completion = function() { return completion(this._id); }
Template.team_summary.username = function() { return username(this); }
Template.team_summary.avatar = function () { return avatar(this); }
Template.team_summary.current_task = function(user, team) {
    var task = current_task(user, team._id);
    return task && task.label;
}

Template.team_summary.remaining_members_count = function() {
    return Math.max(members(this).count() - 5, 0);
}


Template.team_add.events({
    'submit form' : function (ev) {
	var $form = $(ev.currentTarget);
	if ($form.find("[name='name']").val().length == 0) {
	    $form.find("[name='name']").parent(".form-group").addClass("has-error");
	    return false;
	}
	var team = Teams.insert({name: $form.find("[name=name]").val(), color1:"rgba(0,220,220,0.5)"});
	Meteor.Router.to("/team/"+team)
        return false;
    }
});

Template.team.current_team = function() { return Teams.findOne({_id: Session.get('currentTeamId')}); }
Template.team.current_focus = function() { return Focus.findOne({team: Session.get('currentTeamId'), state:{$ne:"DONE"}}, { sort: { start_time: -1 }}); }

Template.team_title.current_team = function() { return Teams.findOne({_id: Session.get('currentTeamId')}); }
Template.team_title.current_task = function() { return current_task(Meteor.user(), Session.get('currentTeamId'));}

Template.focus.current_team = function() { return Teams.findOne({_id: Session.get('currentTeamId')}); }
Template.focus.current_focus = function() { return Focus.findOne({team: Session.get('currentTeamId'), state:{$ne:"DONE"}}, { sort: { start_time: -1 }}); }
Template.focus.current_task = function() { return current_task(Meteor.user(), Session.get('currentTeamId'));}

Template.focus.is_current_focus_running = function() {
    var focus = Focus.findOne({team: Session.get('currentTeamId')}, { sort: { start_time: -1 }});
    if (!focus) {return false;}

    if (focus.state == "RUNNING") {
	running = true;
	return true;
    }
    return false;
}

Template.focus.is_current_focus_finished = function() {
    var focus = Focus.findOne({team: Session.get('currentTeamId')}, { sort: { start_time: -1 }});
    if (focus.state == "EVALUATING") {
	if (running) {
	    new Notification("Le focus est terminé.");
	    running = false;
	}
	return true;
    }
    return false;
}

Handlebars.registerHelper("setTitle", function() {
  var title = "";
  for (var i = 0; i < arguments.length - 1; ++i) {
    title += arguments[i];
  }
    if (title) {
	document.title = "(" + title + ") Collective Focus";
    } else {
	document.title = "Collective Focus"
    }
});

Template.focus.completion = function() { return completion(Session.get('currentTeamId')); }
Template.focus.beforeCompletion = function() { return -completion(Session.get('currentTeamId')); }

Template.focus.countdown = function() {
    var focus = Focus.findOne({team: Session.get('currentTeamId')}, { sort: { start_time: -1 }});
    if (!focus) {
	return "--:--";
    }

    var last = Math.floor((focus.end_time - Session.get("currentTime"))/1000);
    if (last < 0) {last = 0};
    var minutes = Math.floor(last / 60);
    var seconds = last % 60;
    if (seconds < 10) {seconds = "0"+seconds;}
    return minutes + ":" + seconds;
}

Template.focus.events({
    'click button#focus-start' : function (ev) {

        var focus = Focus.findOne({team: Session.get('currentTeamId')}, { sort: { start_time: -1 }});
        Focus.insert({team:Session.get('currentTeamId')});

    },
    'submit form#next-focus' : function (ev) {
        var $form = $(ev.currentTarget);
        var focus = Focus.findOne({_id: $form.attr("data-focus")});
        var task = Tasks.findOne({focus: focus._id, user:Meteor.userId()});

        if (task) {
            Tasks.update({_id: task._id}, {$set: {label: $form.children("input[name=task]").val()}});
        } else {
            Tasks.insert({focus:focus._id, label:$form.children("input[name=task]").val(), user:Meteor.userId()});
            var team = Teams.findOne({_id:Session.get("currentTeamId")});

            if (!_.contains(team.members, Meteor.userId())) {
                Teams.update({_id:Session.get("currentTeamId")}, {$push:{members:Meteor.userId()}});
            }
        }
        return false;
    },
    'click button.focus-value' : function (ev) {
        var $button = $(ev.currentTarget);
    $button.siblings().removeClass("active");
    $button.addClass("active");
        var task = Tasks.findOne({_id:$button.attr("data-task")});
        Tasks.update({_id: task._id}, {$set: {value: parseInt($button.val())}});
    },
    'click button.skip-evaluation' : function (ev) {
    var $button = $(ev.currentTarget);
    Focus.update({_id:$button.attr("data-focus")}, {$set: {state:"DONE"}});
    }
});

Template.members.all_members = function() { return members(Teams.findOne({_id:Session.get('currentTeamId')})); }

Template.members.username = function() { return username(this); }
Template.members.avatar = function () { return avatar(this); }


Template.stats.hide = function() { return Focus.find({team: Session.get('currentTeamId'), state:{$ne:"DONE"}}).count() != 0; }

Template.stats.show_stats = function() {

    var team = Teams.findOne({_id:Session.get("currentTeamId")});

    if (!team) {return; }
    var users = team.members;
    var focuses = Focus.find({team: Session.get('currentTeamId')});
    var values = {};

    var labels = [];

    focuses.forEach(function(focus) {

	labels.push(focus._id);

	_.each(users, function(user, index) {
	    var task = Tasks.findOne({focus: focus._id, user:user});
	    if (!values[user]) { values[user] = []; }
	    values[user].push(task && task.value || undefined);

	});
    });

    var datasets = []
    _.each(_.values(values), function(data) {
	datasets.push({
			fillColor : "rgba(0,0,0,0)",
			strokeColor : "rgba(151,187,205,1)",
			pointColor : "rgba(151,187,205,1)",
			pointStrokeColor : "rgba(50,60,70,1)",
	    "data":data
	})
    });
    var data = {
	"labels" : labels,
	"datasets" : datasets
    };

    Meteor.defer(function() {
	if (!document.getElementById("stats-chart")){return;}
	var ctx = document.getElementById("stats-chart").getContext("2d");
	new Chart(ctx).Line(data, {
	    scaleOverride : true,
	scaleSteps : 5,
	scaleStepWidth : 20,
	scaleStartValue : 0,
	});
    });
    return ;
}

Template.stats.user = function() {
    var user =  Users.findOne({_id:this[0]});
    if (!user) { return this[0]; }
    return username(user);
}
Template.stats.values = function() {
    return _.pluck(this[1],"value")
}
