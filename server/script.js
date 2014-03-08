Meteor.startup(function () {
    // code to run on server at startup

    // server: populate collections with some initial documents
//    Teams.remove({});
//    Focus.remove({});
//    Tasks.remove({});
//    Users.remove({});

    if (Teams.find({}).count() === 0) {
        Teams.insert({name: "Cool '80", members:[]});
    }

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


    if (Users.find({}).count() === 0) {
        Accounts.createUser({username:"alexandre", email: "alexandre@e-180.com", password:"123456"});
        Accounts.createUser({username:"christine", email: "christine@e-180.com", password:"123456"});
        Accounts.createUser({username:"simon", email: "simon@espacestemps.ca", password:"123456"});
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
