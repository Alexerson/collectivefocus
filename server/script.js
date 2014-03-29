function generate_color() {
    var color = 'hsl(';
    color += Math.round(Math.random() * 360) + ",";
    color += Math.round(Math.random() * 100) + "%,";
    color += Math.round(Math.random() * 100) + "%)";

    return color;
}

var focus_length = 25 * 60; // temps en secondes
var before_focus = 30;

var update_focus = function(focus) {

    if (focus.state == "WAITING") {
	if (focus.start_time <= new Date()){
	    focus.state = "RUNNING";
	    Focus.update({_id: focus._id}, {$set: {state: focus.state}});
	}
    }

    if (focus.state == "RUNNING") {
	var tasks = Tasks.find({focus: focus._id});
	if (tasks.count() == 0){
	    focus.state = "DONE";
	    Focus.update({_id: focus._id}, {$set: {state: focus.state}});
	    return;
	}
    }
    if (focus.end_time <= new Date()){
	var tasks = Tasks.find({focus: focus._id, value:undefined});
	if (tasks.count() == 0) {
	    focus.state = "DONE";
	} else {
	    focus.state = "EVALUATING";
	}
	Focus.update({_id: focus._id}, {$set: {state: focus.state}});
	return;
    }

    Meteor.setTimeout(function() {update_focus(focus);},1000);
};

Meteor.startup(function () {
    // code to run on server at startup

    // server: populate collections with some initial documents
//    Teams.remove({});
//    Focus.remove({});
//    Tasks.remove({});
//    Users.remove({});

    if (Teams.find({}).count() === 0) {
	//Teams.insert({name: "Cool '80", color1: generate_color(), color2: generate_color()});
	Teams.insert({name: "Cool '80", color1:"rgba(0,220,220,0.5)"});
    }

    Focus.find({state:{$nin:["EVALUATING","DONE"]}}).forEach(function(focus){
	update_focus(focus);
    });

    Accounts.onCreateUser(function(options, user) {
	// We still want the default hook's 'profile' behavior.
	if (options.profile)
	    user.profile = options.profile;
	else
	    user.profile = {};
	if (options.email) {
	    var md5 = CryptoJS.MD5(options.email.trim().toLowerCase()).toString(CryptoJS.enc.Hex);
	    user.profile.md5 = md5;
	}
	return user;
    });

    Focus.before.insert(function (userId, focus) {
	focus.state = "WAITING";
	var start_time = new Date()
	start_time.setSeconds(start_time.getSeconds() + before_focus);
	focus.start_time = start_time;
	var end_time = new Date();
	end_time.setSeconds(end_time.getSeconds() + before_focus);
	end_time.setSeconds(end_time.getSeconds() + focus_length);
	focus.end_time = end_time;
    });

    Focus.after.insert(function (userId, focus) {
	update_focus(focus);
    });

    Tasks.after.update(function(userId, task) {
	var tasks = Tasks.find({focus: task.focus, value:undefined});
	if (tasks.count() == 0) {
	    Focus.update({_id: task.focus}, {$set: {state: "DONE"}});
	}
    });

    if (Users.find({}).count() === 0) {
        //Accounts.createUser({username:"alexandre", email: "alexandre@e-180.com", password:"123456"});
        //Accounts.createUser({username:"christine", email: "christine@e-180.com", password:"123456"});
        //Accounts.createUser({username:"simon", email: "simon@espacestemps.ca", password:"123456"});
    }
});
/*
Meteor.publish("all-teams", function () {
    return Teams.find(); // everything
});

Meteor.publish("team-focus", function (teamId) {
    return Focus.find({team: teamId}); // everything
});

Meteor.publish("focus-tasks", function (focusId) {
  return Tasks.find({focus: focusId});
});

Meteor.publish("user-tasks", function (userId) {
  return Tasks.find({user: userId});
});

// REMOVE
Meteor.publish("all-focus", function () {return Focus.find();});
Meteor.publish("all-tasks", function () {return Tasks.find();});
*/
