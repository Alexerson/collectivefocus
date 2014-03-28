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

var avatar = function(user) {

    _.defer(function() {$("[data-toggle=tooltip]").tooltip()});

    if (user.services.twitter) {
	if (user.services.twitter.profile_image_url) {
	    return user.services.twitter.profile_image_url;
	}
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
    return Users.find({_id: {$in: users_id}});
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
    if (focus.state == "WAITING") {
	return (100 * (focus.remaining-focus_length) / before_focus);
    }
    if (focus.state == "DONE") { return 100; }
    if (focus.state == "EVALUATING") { return 100; }
    return 100 - (100 * focus.remaining / focus_length);
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

Template.home.team = function() {
    return Teams.find().fetch();
}

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

    var last = focus.remaining ;
    if (last < 0) {last = 0};
    var minutes = Math.floor(last / 60);
    var seconds = last % 60;
    if (seconds < 10) {seconds = "0"+seconds;}
    return minutes + ":" + seconds;
}

Template.focus.events({
    'click button#focus-start' : function (ev) {

        var focus = Focus.findOne({team: Session.get('currentTeamId')}, { sort: { start_time: -1 }});
        Focus.insert({team:Session.get('currentTeamId'), state:"WAITING", remaining:focus_length + before_focus});

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


Template.stats.current_focus = function() { return Focus.findOne({team: Session.get('currentTeamId'), state:{$ne:"DONE"}}, { sort: { start_time: -1 }}); }

Template.stats.old_tasks = function() {
    var values = {};
    var focuses = Focus.find({team: Session.get('currentTeamId')});
    focuses.forEach(function(focus) {
	var tasks = Tasks.find({focus: focus._id});
	tasks.forEach(function (task) {
	    if (!values[task.user]) {
		values[task.user] = [];
	    }
	    values[task.user].push({value:task.value, focus:task.focus});
	});
    });
    return _.pairs(values);
}

Template.stats.user = function() {
    var user =  Users.findOne({_id:this[0]});
    if (!user) { return this[0]; }
    return username(user);
}
Template.stats.values = function() {
    return _.pluck(this[1],"value")
}




/*

var create_timer = function() {
    var r = Raphael(10,10, 200, 200),
    R = 200,
    init = true,
    param = {stroke: "#fff", "stroke-width": 30},
    hash = document.location.hash,
    marksAttr = {fill: hash || "#444", stroke: "none"},
    html = [
        document.getElementById("h"),
        document.getElementById("m"),
        document.getElementById("s"),
        document.getElementById("d"),
        document.getElementById("mnth"),
        document.getElementById("ampm")
    ];
    // Custom Attribute
    r.customAttributes.arc = function (value, total, R) {
        var alpha = 360 / total * value,
        a = (90 - alpha) * Math.PI / 180,
        x = 300 + R * Math.cos(a),
        y = 300 - R * Math.sin(a),
        color = "hsb(".concat(Math.round(R) / 200, ",", value / total, ", .75)"),
        path;
        if (total == value) {
            path = [["M", 300, 300 - R], ["A", R, R, 0, 1, 1, 299.99, 300 - R]];
        } else {
            path = [["M", 300, 300 - R], ["A", R, R, 0, +(alpha > 180), 1, x, y]];
        }
        return {path: path, stroke: color};
    };

    drawMarks(R, 60);
    var sec = r.path().attr(param).attr({arc: [0, 60, R]});
    R -= 40;
    drawMarks(R, 60);
    var min = r.path().attr(param).attr({arc: [0, 60, R]});
    R -= 40;
    drawMarks(R, 12);
    var hor = r.path().attr(param).attr({arc: [0, 12, R]});
    R -= 40;
    drawMarks(R, 31);
    var day = r.path().attr(param).attr({arc: [0, 31, R]});
    R -= 40;
    drawMarks(R, 12);
    var mon = r.path().attr(param).attr({arc: [0, 12, R]});
    var pm = r.circle(300, 300, 16).attr({stroke: "none", fill: Raphael.hsb2rgb(15 / 200, 1, .75).hex});
    html[5].style.color = Raphael.hsb2rgb(15 / 200, 1, .75).hex;

    function updateVal(value, total, R, hand, id) {
        if (total == 31) { // month
            var d = new Date;
            d.setDate(1);
            d.setMonth(d.getMonth() + 1);
            d.setDate(-1);
            total = d.getDate();
        }
        var color = "hsb(".concat(Math.round(R) / 200, ",", value / total, ", .75)");
        if (init) {
            hand.animate({arc: [value, total, R]}, 900, ">");
        } else {
            if (!value || value == total) {
                value = total;
                hand.animate({arc: [value, total, R]}, 750, "bounce", function () {
                    hand.attr({arc: [0, total, R]});
                });
            } else {
                hand.animate({arc: [value, total, R]}, 750, "elastic");
            }
        }
        html[id].innerHTML = (value < 10 ? "0" : "") + value;
        html[id].style.color = Raphael.getRGB(color).hex;
    }

    function drawMarks(R, total) {
        if (total == 31) { // month
            var d = new Date;
            d.setDate(1);
            d.setMonth(d.getMonth() + 1);
            d.setDate(-1);
            total = d.getDate();
        }
        var color = "hsb(".concat(Math.round(R) / 200, ", 1, .75)"),
        out = r.set();
        for (var value = 0; value < total; value++) {
            var alpha = 360 / total * value,
            a = (90 - alpha) * Math.PI / 180,
            x = 300 + R * Math.cos(a),
            y = 300 - R * Math.sin(a);
            out.push(r.circle(x, y, 2).attr(marksAttr));
        }
        return out;
    }

    (function () {
        var d = new Date,
        am = (d.getHours() < 12),
        h = d.getHours() % 12 || 12;
        updateVal(d.getSeconds(), 60, 200, sec, 2);
        updateVal(d.getMinutes(), 60, 160, min, 1);
        updateVal(h, 12, 120, hor, 0);
        updateVal(d.getDate(), 31, 80, day, 3);
        updateVal(d.getMonth() + 1, 12, 40, mon, 4);
        pm[(am ? "hide" : "show")]();
        html[5].innerHTML = am ? "AM" : "PM";
        setTimeout(arguments.callee, 1000);
        init = false;
    })();
};
*/
