// Souscription aux données
//Meteor.subscribe("team-tasks");
//Meteor.subscribe("team-focus");
//Meteor.subscribe("user-tasks");

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

//CryptoJS.MD5("Alexandre@e-180.com".trim().toLowerCase()).toString(CryptoJS.enc.Hex)

Meteor.Router.add({
    '/': 'home',
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
    $("body").removeClass();
    if (route.path == "/") {
        $("body").addClass("home");
    } else {
        $("body").addClass(route.path.substr(1));
    }
}

Meteor.setInterval(function(){Session.set('currentTime', new Date())}, 1000);

Template.header.user = function () {
    return Meteor.user();
};
Template.header.status = function() {
    return Meteor.status().status
}


Template.header.first_name = function () { return Meteor.user().profile.first_name; };
Template.header.avatar = function () { return Meteor.user().profile.avatar || "avatar.png"; };

Template.header.events({
    'click a#login' : function () { Meteor.login(); },
    'click a#logout' : function () { Meteor.logout(); }
});


Template.home.team = function() {
    return Teams.find().fetch(); // synchronous!
}

Template.team_summary.first_members = function() {
    return Users.find({_id: {$in: this.members}}, {limit:3});
}

Template.team_summary.remaining_members_count = function() {
    if (this.members.length > 3) {
        return this.members.length - 3;
    }
    return 0
}

Template.team.current_team = function() {
    return Teams.findOne({_id: Session.get('currentTeamId')});
}

Template.team.current_focus = function() {
    return Focus.findOne({team: Session.get('currentTeamId'), done:false}, { sort: { start_time: -1 }});
}

Template.team.is_current_focus_running = function() {
    var focus = Focus.findOne({team: Session.get('currentTeamId')}, { sort: { start_time: -1 }});
    if (!focus) {return false;}
    if (focus.start_time >= Session.get('currentTime') || focus.end_time < Session.get('currentTime')) {return false;}
    return true
}

Template.team.is_current_focus_finished = function() {
    var focus = Focus.findOne({team: Session.get('currentTeamId')}, { sort: { start_time: -1 }});
    return focus.end_time < Session.get('currentTime');
}

Template.team.completion = function() {
    var focus = Focus.findOne({team: Session.get('currentTeamId')}, { sort: { start_time: -1 }});
    if (!focus) {return 0;}
    if (focus.start_time >= Session.get('currentTime')) {return (Session.get('currentTime') - focus.start_time)/600;}
    if (focus.end_time < Session.get('currentTime')) {return 1;}
    return (Session.get('currentTime') - focus.start_time) / (focus.end_time - focus.start_time)

}

Template.team.current_task = function() {
    var focus = Focus.findOne({team: Session.get('currentTeamId')});
    if (Meteor.userId()) {
        return Tasks.findOne({focus: focus._id, user:Meteor.userId(), value:undefined});
    }
}

Template.team.events({
    'click button#focus-start' : function (ev) {

        var focus = Focus.findOne({team: Session.get('currentTeamId')}, { sort: { start_time: -1 }});
        var start = new Date();
        if (focus && focus.end_time >= start) {return false;}
        start.setSeconds(start.getSeconds()+30)
        var end = new Date(start);
        end.setMinutes(end.getMinutes()+25)
        Focus.insert({team:Session.get('currentTeamId'), start_time: start, end_time: end, done:false});

    },
    'submit form#next-focus' : function (ev) {
        var $form = $(ev.currentTarget);
        var focus = Focus.findOne({_id: $form.attr("data-focus")});
        var task = Tasks.findOne({focus: focus._id, user:Meteor.userId()});

        if (task) {
            Tasks.update({_id: task._id}, {$set: {label: $form.children("input[name=task]").val()}});
        } else {
            Tasks.insert({focus:focus._id, label:$form.children("input[name=task]").val(), user:Meteor.userId()});
        }
        return false;
    },
    'click button.focus-value' : function (ev) {
        var $button = $(ev.currentTarget);
        var task = Tasks.findOne({_id:$button.attr("data-task")});
        Tasks.update({_id: task._id}, {$set: {value: parseInt($button.val())}});

        if ( Tasks.find({focus:task.focus, value:undefined}).count() == 0) {
            Focus.update({_id: task.focus}, {$set: {done:true}});
        }
    }
});

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
